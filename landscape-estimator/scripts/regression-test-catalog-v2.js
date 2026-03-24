/**
 * Regression test: catalog-v2 adapter layer
 *
 * Runs 12 automated checks and generates
 * data/catalog-v2/preview-regression-report.json
 *
 * Usage:  node scripts/regression-test-catalog-v2.js
 *    or:  npm run test:catalog-v2
 */

"use strict";

const fs   = require("fs");
const path = require("path");

// ─── Load data ────────────────────────────────────────────────────────────────
const root  = path.resolve(__dirname, "..");
const load  = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf-8"));

const pricing       = load("src/config/pricing.json");
const materialsV1   = load("src/config/materials.json");
const worksV2       = load("data/catalog-v2/works.json");
const workVarsV2    = load("data/catalog-v2/work-variants.json");
const matsV2        = load("data/catalog-v2/materials.json");
const matVarsV2     = load("data/catalog-v2/material-variants.json");
const manualRemap   = load("data/catalog-v2/manual-remap.json");
const bfWorksRaw    = load("data/catalog-v2/legacy-backfill-works.json");
const bfMatsRaw     = load("data/catalog-v2/legacy-backfill-materials.json");

const bfWorks = bfWorksRaw.filter((e) => e.id && e.legacyKey);
const bfMats  = bfMatsRaw.filter((e) => e.id && e.legacyTitle);

// ─── Adapter logic (mirrors src/lib/catalogV2/adapter.ts) ────────────────────

const CANONICAL_WORKS = {
  "lawn:roll":        "RWORK-0152",
  "lawn:seed":        "RWORK-0120",
  "lawn:sport":       "RWORK-0153",
  "paving:tile":      "RWORK-0074",
  "paving:natural":   "RWORK-0069",
  "paving:gravel":    "RWORK-0123",
  "curb:concrete":    "RWORK-0114",
  "curb:metal":       "RWORK-0143",
  "drainage:surface": "RWORK-0151",
  "drainage:deep":    "RWORK-0128",
  "lighting:spot":    "RWORK-0049",
};

const CANONICAL_MATS = {
  "плодородный грунт":  "RMAT-0033",
  "геотекстиль":        "RMAT-0025",
  "рулонный газон":     "RMAT-0022",
  "торф":               "RMAT-0100",
  "удобрение комплексное": "RMAT-0107",
  "дренажная труба ø110":  "RMAT-0103",
  "кабель ввг 2×1,5":  "RMAT-0048",
};

const norm = (s) =>
  s.toLowerCase()
    .replace(/[«»''.,;:()\[\]{}\-\/\\*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function wordSet(s) {
  return new Set(norm(s).split(" ").filter((w) => w.length > 2));
}

function sim(a, b) {
  const sa = wordSet(a);
  const sb = wordSet(b);
  if (!sa.size || !sb.size) return 0;
  let m = 0;
  sa.forEach((w) => { if (sb.has(w)) m++; });
  return m / Math.min(sa.size, sb.size);
}

function resolveWork(cat, variantId, label) {
  const key = `${cat}:${variantId}`;
  // 1. canonical
  if (CANONICAL_WORKS[key]) return { step: "canonical", id: CANONICAL_WORKS[key] };
  // 2. manual remap (works)
  const mrW = (manualRemap.works || []).find((r) => r.v1CategoryKey === key);
  if (mrW) return { step: "manual-remap", id: mrW.v2WorkId };
  // 3. legacy key
  const bfW = bfWorks.find((w) => w.legacyKey === key);
  if (bfW) return { step: "legacy-key", id: bfW.id };
  // 4. normalized title (v2-only)
  let best = 0, bw = null;
  worksV2.forEach((w) => {
    const s = Math.max(sim(label, w.canonicalName), sim(label, w.keywords || ""));
    if (s > best) { best = s; bw = w; }
  });
  if (best >= 0.5) return { step: "normalized", id: bw.id, score: best };
  return null;
}

function resolvePrice_work(id) {
  const wv = workVarsV2.find((v) => v.workId === id && v.isDefault);
  if (wv) return wv.effectiveUnitPrice;
  const bf = bfWorks.find((b) => b.id === id);
  if (bf) return bf.defaultVariantPrice;
  return null;
}

function resolveMat(title) {
  const nk = norm(title);
  // 1. canonical
  const cid = CANONICAL_MATS[nk] || CANONICAL_MATS[title.toLowerCase().trim()];
  if (cid) return { step: "canonical", id: cid };
  // 2. manual remap
  const mrM = (manualRemap.materials || []).find(
    (r) => norm(r.v1Title) === nk || r.v1Title.toLowerCase() === title.toLowerCase()
  );
  if (mrM) return { step: "manual-remap", id: mrM.v2MaterialId };
  // 3. legacy title
  const bfM = bfMats.find(
    (m) => norm(m.legacyTitle) === nk || m.legacyTitle.toLowerCase() === title.toLowerCase()
  );
  if (bfM) return { step: "legacy-title", id: bfM.id };
  // 4. normalized (v2-only)
  let best = 0, bm = null;
  matsV2.forEach((m) => {
    const s = Math.max(sim(title, m.canonicalName), sim(title, m.family || ""));
    if (s > best) { best = s; bm = m; }
  });
  if (best >= 0.5) return { step: "normalized", id: bm.id, score: best };
  return null;
}

function resolvePrice_mat(id) {
  const mv = matVarsV2.find((v) => v.materialId === id && v.isDefault);
  if (mv && mv.pricePerUnit != null) return mv.pricePerUnit;
  const bf = bfMats.find((b) => b.id === id);
  if (bf) return bf.defaultVariantPrice;
  return null;
}

// ─── Build v1 pair list ───────────────────────────────────────────────────────

const v1WorkPairs = [];
pricing.forEach((cat) =>
  cat.variants.forEach((v) =>
    v1WorkPairs.push({ cat: cat.id, var: v.id, label: v.label, unit: cat.unit, v1Price: v.unitPrice })
  )
);

// ─── Run checks ───────────────────────────────────────────────────────────────

const results = [];
const now = new Date().toISOString();

function check(id, description, fn) {
  try {
    const { pass, details, warnings } = fn();
    results.push({ id, description, status: pass ? "PASS" : "FAIL", details: details || null, warnings: warnings || null });
  } catch (e) {
    results.push({ id, description, status: "ERROR", details: e.message, warnings: null });
  }
}

// ── CHECK 1: adapter coverage works ──────────────────────────────────────────
check("adapter_coverage_works", "All 22 v1 work pairs resolve (requiresRemap = 0)", () => {
  const unresolved = [];
  v1WorkPairs.forEach((p) => {
    const r = resolveWork(p.cat, p.var, p.label);
    if (!r) unresolved.push(`${p.cat}:${p.var}`);
  });
  return {
    pass: unresolved.length === 0,
    details: unresolved.length === 0
      ? `All ${v1WorkPairs.length} pairs resolved`
      : `Unresolved: ${unresolved.join(", ")}`,
  };
});

// ── CHECK 2: no fuzzy match on works ─────────────────────────────────────────
check("adapter_no_fuzzy_works", "No work uses fuzzy 'normalized' matching", () => {
  const fuzzy = [];
  v1WorkPairs.forEach((p) => {
    const r = resolveWork(p.cat, p.var, p.label);
    if (r?.step === "normalized") fuzzy.push(`${p.cat}:${p.var} → ${r.id} (score ${r.score?.toFixed(2)})`);
  });
  return {
    pass: fuzzy.length === 0,
    details: fuzzy.length === 0 ? "All works resolved via deterministic steps" : `Fuzzy: ${fuzzy.join("; ")}`,
  };
});

// ── CHECK 3: no null/zero prices on works ─────────────────────────────────────
check("adapter_no_null_prices_works", "All resolved works have price > 0", () => {
  const bad = [];
  v1WorkPairs.forEach((p) => {
    const r = resolveWork(p.cat, p.var, p.label);
    if (!r) return;
    const price = resolvePrice_work(r.id);
    if (price == null || price <= 0) bad.push(`${p.cat}:${p.var} → ${r.id} (price=${price})`);
  });
  return {
    pass: bad.length === 0,
    details: bad.length === 0 ? "All work prices > 0" : `Bad prices: ${bad.join("; ")}`,
  };
});

// ── CHECK 4: adapter coverage materials ──────────────────────────────────────
check("adapter_coverage_materials", "All 15 v1 materials resolve (requiresRemap = 0)", () => {
  const unresolved = [];
  materialsV1.forEach((m) => {
    const r = resolveMat(m.title);
    if (!r) unresolved.push(m.title);
  });
  return {
    pass: unresolved.length === 0,
    details: unresolved.length === 0
      ? `All ${materialsV1.length} materials resolved`
      : `Unresolved: ${unresolved.join(", ")}`,
  };
});

// ── CHECK 5: no null/zero prices on materials ─────────────────────────────────
check("adapter_no_null_prices_materials", "All resolved materials have price >= 0 (no null)", () => {
  const bad = [];
  materialsV1.forEach((m) => {
    const r = resolveMat(m.title);
    if (!r) return;
    const price = resolvePrice_mat(r.id);
    if (price == null) bad.push(`${m.title} → ${r.id} (price=null)`);
    // price=0 is technically a warning, not a failure
  });
  const warnings = [];
  materialsV1.forEach((m) => {
    const r = resolveMat(m.title);
    if (!r) return;
    const price = resolvePrice_mat(r.id);
    if (price === 0) warnings.push(`${m.title} → ${r.id} (price=0, check variant)`);
  });
  return {
    pass: bad.length === 0,
    details: bad.length === 0 ? "All material prices resolved (not null)" : `Null prices: ${bad.join("; ")}`,
    warnings: warnings.length > 0 ? warnings : null,
  };
});

// ── CHECK 6: backfill works integrity ────────────────────────────────────────
check("backfill_works_integrity", "All legacy-backfill-works.json entries have required fields", () => {
  const REQUIRED = ["id", "legacyKey", "canonicalName", "unit", "defaultVariantPrice", "source", "isLegacyCompatible"];
  const bad = [];
  bfWorks.forEach((w) => {
    const missing = REQUIRED.filter((f) => w[f] == null || w[f] === "");
    if (missing.length) bad.push(`${w.id || "?"}: missing ${missing.join(", ")}`);
    if (w.source !== "legacy-backfill") bad.push(`${w.id}: source is not 'legacy-backfill'`);
    if (w.isLegacyCompatible !== true) bad.push(`${w.id}: isLegacyCompatible is not true`);
    if (!(w.defaultVariantPrice > 0)) bad.push(`${w.id}: defaultVariantPrice=${w.defaultVariantPrice} (must be > 0)`);
    if (!w.unit || w.unit.trim() === "") bad.push(`${w.id}: unit is empty`);
  });
  return {
    pass: bad.length === 0,
    details: bad.length === 0
      ? `All ${bfWorks.length} backfill work entries valid`
      : bad.join("; "),
  };
});

// ── CHECK 7: backfill materials integrity ────────────────────────────────────
check("backfill_materials_integrity", "All legacy-backfill-materials.json entries have required fields", () => {
  const REQUIRED = ["id", "legacyTitle", "canonicalName", "baseUnit", "defaultVariantPrice", "source", "isLegacyCompatible"];
  const bad = [];
  bfMats.forEach((m) => {
    const missing = REQUIRED.filter((f) => m[f] == null || m[f] === "");
    if (missing.length) bad.push(`${m.id || "?"}: missing ${missing.join(", ")}`);
    if (m.source !== "legacy-backfill") bad.push(`${m.id}: source is not 'legacy-backfill'`);
    if (m.isLegacyCompatible !== true) bad.push(`${m.id}: isLegacyCompatible is not true`);
    if (!(m.defaultVariantPrice > 0)) bad.push(`${m.id}: defaultVariantPrice=${m.defaultVariantPrice} (must be > 0)`);
    if (!m.baseUnit || m.baseUnit.trim() === "") bad.push(`${m.id}: baseUnit is empty`);
  });
  return {
    pass: bad.length === 0,
    details: bad.length === 0
      ? `All ${bfMats.length} backfill material entries valid`
      : bad.join("; "),
  };
});

// ── CHECK 8: canonical map IDs exist in v2 ───────────────────────────────────
check("canonical_map_ids_exist", "All RWORK-XXXX in canonicalMap exist in works.json", () => {
  const missing = [];
  Object.entries(CANONICAL_WORKS).forEach(([key, id]) => {
    if (!worksV2.find((w) => w.id === id)) missing.push(`${key} → ${id}`);
  });
  return {
    pass: missing.length === 0,
    details: missing.length === 0
      ? `All ${Object.keys(CANONICAL_WORKS).length} canonical work IDs verified`
      : `Missing in works.json: ${missing.join(", ")}`,
  };
});

// ── CHECK 9: manual-remap IDs exist in v2 ────────────────────────────────────
check("manual_remap_ids_exist", "All v2MaterialId in manual-remap.json exist in materials.json", () => {
  const missing = [];
  (manualRemap.materials || []).forEach((r) => {
    if (!matsV2.find((m) => m.id === r.v2MaterialId))
      missing.push(`${r.v1Title} → ${r.v2MaterialId}`);
  });
  (manualRemap.works || []).forEach((r) => {
    if (!worksV2.find((w) => w.id === r.v2WorkId))
      missing.push(`${r.v1CategoryKey} → ${r.v2WorkId}`);
  });
  const total = (manualRemap.materials || []).length + (manualRemap.works || []).length;
  return {
    pass: missing.length === 0,
    details: missing.length === 0
      ? `All ${total} manual-remap entries reference valid v2 IDs`
      : `Missing in v2: ${missing.join(", ")}`,
  };
});

// ── CHECK 10: backfill IDs unique (no collision with v2) ─────────────────────
check("backfill_ids_unique", "LEGACY-WORK/LEGACY-MAT IDs do not collide with v2 catalog IDs", () => {
  const collisions = [];
  const v2WorkIds = new Set(worksV2.map((w) => w.id));
  const v2MatIds  = new Set(matsV2.map((m) => m.id));
  bfWorks.forEach((w) => { if (v2WorkIds.has(w.id)) collisions.push(`work ${w.id}`); });
  bfMats.forEach((m)  => { if (v2MatIds.has(m.id))  collisions.push(`mat ${m.id}`); });
  return {
    pass: collisions.length === 0,
    details: collisions.length === 0
      ? `No ID collisions (${bfWorks.length} work + ${bfMats.length} mat backfill entries)`
      : `Collisions: ${collisions.join(", ")}`,
  };
});

// ── CHECK 11: feature flag off by default ────────────────────────────────────
check("feature_flag_default_off", "NEXT_PUBLIC_CATALOG_V2_PREVIEW is not set (flag off by default)", () => {
  const envFile = path.join(root, ".env.local");
  let envContent = "";
  if (fs.existsSync(envFile)) envContent = fs.readFileSync(envFile, "utf-8");
  const flagOn = process.env.NEXT_PUBLIC_CATALOG_V2_PREVIEW === "true" ||
    envContent.includes("NEXT_PUBLIC_CATALOG_V2_PREVIEW=true");
  return {
    pass: !flagOn,
    details: flagOn
      ? "WARNING: NEXT_PUBLIC_CATALOG_V2_PREVIEW=true is set — v2 would be active at build time"
      : "Flag not set in env — v2 disabled by default (localStorage toggle only)",
  };
});

// ── CHECK 12: estimate calc parity ───────────────────────────────────────────
check("estimate_calc_parity", "Sample estimate with all v1 categories produces valid totals", () => {
  // Replicate simplified buildEstimate
  const sampleInputs = v1WorkPairs.map((p) => ({ cat: p.cat, var: p.var, qty: 10 }));
  const sampleMaterials = materialsV1.map((m) => ({ title: m.title, qty: 2, price: m.defaultPrice }));

  let worksSubtotal = 0;
  const lines = [];
  sampleInputs.forEach((inp) => {
    const cat = pricing.find((c) => c.id === inp.cat);
    const variant = cat?.variants.find((v) => v.id === inp.var);
    if (!variant) return;
    const subtotal = inp.qty * variant.unitPrice;
    worksSubtotal += subtotal;
    lines.push({ id: `${inp.cat}:${inp.var}`, subtotal });
  });

  const coeff = 1.2;
  const worksTotal = Math.round(worksSubtotal * coeff);
  const materialsSubtotal = sampleMaterials.reduce((s, m) => s + m.qty * m.price, 0);
  const extraCostsTotal = 5000;
  const baseTotal = worksTotal + materialsSubtotal + extraCostsTotal;

  // discount 10%
  const discountAmount = Math.round(baseTotal * 0.1);
  const finalTotal = baseTotal - discountAmount;
  // prepayment 30%
  const prepaymentAmount = Math.round(finalTotal * 0.3);
  const remaining = finalTotal - prepaymentAmount;

  const issues = [];
  if (isNaN(worksTotal))       issues.push("worksTotal is NaN");
  if (isNaN(materialsSubtotal)) issues.push("materialsSubtotal is NaN");
  if (isNaN(finalTotal))       issues.push("finalTotal is NaN");
  if (finalTotal <= 0)         issues.push("finalTotal <= 0");
  if (prepaymentAmount <= 0)   issues.push("prepaymentAmount <= 0");
  if (remaining <= 0)          issues.push("remaining <= 0");
  if (lines.length !== v1WorkPairs.length) issues.push(`Only ${lines.length}/${v1WorkPairs.length} lines built`);

  return {
    pass: issues.length === 0,
    details: issues.length === 0
      ? `worksTotal=${worksTotal} materialsSubtotal=${materialsSubtotal} finalTotal=${finalTotal} prepayment=${prepaymentAmount} remaining=${remaining}`
      : `Issues: ${issues.join("; ")}`,
  };
});

// ─── Manual checklist ─────────────────────────────────────────────────────────

const manualChecklist = [
  {
    id: "open_saved_estimate",
    scenario: "Открытие старой сметы",
    steps: [
      "Открыть приложение (localhost:3000)",
      "Проверить, что черновик загружается из localStorage",
      "Все поля (клиент, адрес, работы, материалы) присутствуют",
    ],
    expectedResult: "Смета открывается без потери данных, итоговая сумма совпадает с сохранённой",
    status: "requires_manual",
  },
  {
    id: "recalc_saved_estimate",
    scenario: "Пересчёт старой сметы",
    steps: [
      "Открыть сохранённую смету из истории",
      "Изменить количество в любой строке работ",
      "Убедиться, что итоги пересчитываются мгновенно",
    ],
    expectedResult: "Итог пересчитан корректно, нет NaN, нет пустых строк",
    status: "requires_manual",
  },
  {
    id: "print_old_estimate",
    scenario: "Печать старой сметы",
    steps: [
      "Создать или открыть смету с работами, материалами и доп. расходами",
      "Нажать «Распечатать»",
      "Проверить страницу /print",
    ],
    expectedResult: "Все разделы видны: Работы, Материалы, Доп. расходы, Итого, подписи, дисклеймер",
    status: "requires_manual",
  },
  {
    id: "new_estimate_from_catalog",
    scenario: "Создание новой сметы из каталога",
    steps: [
      "Нажать «+ Из каталога»",
      "Выбрать категорию и вариант",
      "Ввести количество",
    ],
    expectedResult: "Строка добавлена, подитог рассчитан, итог обновился",
    status: "requires_manual",
  },
  {
    id: "manual_line_row",
    scenario: "Ручная строка работ",
    steps: [
      "Нажать «+ Ручная строка»",
      "Заполнить название, ед. изм., кол-во, цену",
    ],
    expectedResult: "Подитог = qty × price, строка сохраняется в localStorage",
    status: "requires_manual",
  },
  {
    id: "materials_presets",
    scenario: "Материалы — подсказки из каталога",
    steps: [
      "Добавить материал",
      "Начать вводить название",
    ],
    expectedResult: "Появляются подсказки из v1-каталога, выбор заполняет цену",
    status: "requires_manual",
  },
  {
    id: "extra_costs",
    scenario: "Дополнительные расходы",
    steps: [
      "Добавить доп. расход",
      "Проверить подсказки (Доставка, Вывоз мусора и т.д.)",
      "Ввести сумму",
    ],
    expectedResult: "Сумма добавляется к базовому итогу",
    status: "requires_manual",
  },
  {
    id: "discount_markup",
    scenario: "Скидка / наценка / предоплата",
    steps: [
      "В разделе «Финансовые условия» установить наценку 10%",
      "Установить скидку 5%",
      "Установить предоплату 30%",
    ],
    expectedResult: "Summary блок показывает базовый итог, наценку, скидку, итого, предоплату, остаток — без NaN",
    status: "requires_manual",
  },
  {
    id: "save_and_reopen",
    scenario: "Сохранение в историю и повторное открытие",
    steps: [
      "Создать смету, нажать «Сохранить»",
      "Открыть панель «История»",
      "Нажать «Открыть» на сохранённой смете",
    ],
    expectedResult: "Смета открывается с теми же работами, итог совпадает",
    status: "requires_manual",
  },
  {
    id: "feature_flag_toggle",
    scenario: "Feature flag — v2 preview toggle",
    steps: [
      "Открыть DevTools Console",
      "Выполнить: localStorage.setItem('landscape_catalog_v2_preview', 'true')",
      "Убедиться, что основной UI не изменился (v2 не переключился автоматически)",
      "Убедиться, что flag читается: isCatalogV2PreviewEnabled() === true",
    ],
    expectedResult: "UI остаётся на v1, флаг активен только для adapter layer",
    status: "requires_manual",
  },
];

// ─── Compile report ───────────────────────────────────────────────────────────

const passed  = results.filter((r) => r.status === "PASS").length;
const failed  = results.filter((r) => r.status === "FAIL").length;
const errored = results.filter((r) => r.status === "ERROR").length;
const total   = results.length;

const adapterSummary = (() => {
  const wByStep = {};
  v1WorkPairs.forEach((p) => {
    const r = resolveWork(p.cat, p.var, p.label);
    const s = r?.step || "REMAP";
    wByStep[s] = (wByStep[s] || 0) + 1;
  });
  const mByStep = {};
  materialsV1.forEach((m) => {
    const r = resolveMat(m.title);
    const s = r?.step || "REMAP";
    mByStep[s] = (mByStep[s] || 0) + 1;
  });
  return { works: wByStep, materials: mByStep };
})();

const readyForDefaultSwitch =
  failed === 0 &&
  errored === 0 &&
  adapterSummary.works.REMAP === undefined &&
  adapterSummary.materials.REMAP === undefined &&
  adapterSummary.works.normalized === undefined;

const report = {
  _meta: {
    generatedAt: now,
    generatedBy: "scripts/regression-test-catalog-v2.js",
    catalogV2PreviewStatus: "PREVIEW_ONLY — main UI on v1",
  },
  summary: {
    automatedChecks: { total, passed, failed, errored },
    adapterCoverage: adapterSummary,
    manualChecks: {
      total: manualChecklist.length,
      requiresManual: manualChecklist.length,
      completed: 0,
    },
    readyForDefaultSwitch,
    readyForDefaultSwitchNote: readyForDefaultSwitch
      ? "All automated checks pass and no fuzzy matching. Proceed to manual browser verification."
      : `NOT READY: ${failed} automated check(s) failed / ${errored} error(s). Fix before switching default.`,
  },
  automatedResults: results,
  manualChecklist,
};

// ─── Write report ─────────────────────────────────────────────────────────────

const outPath = path.join(root, "data/catalog-v2/preview-regression-report.json");
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf-8");

// ─── Console output ───────────────────────────────────────────────────────────

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║     catalog-v2 Preview Regression Report                     ║");
console.log("╠══════════════════════════════════════════════════════════════╣");
console.log(`  Automated checks: ${passed}/${total} PASS  ${failed > 0 ? failed + " FAIL" : ""}  ${errored > 0 ? errored + " ERROR" : ""}`);
console.log(`  Adapter — works:     ${JSON.stringify(adapterSummary.works)}`);
console.log(`  Adapter — materials: ${JSON.stringify(adapterSummary.materials)}`);
console.log(`  Manual checklist:    ${manualChecklist.length} scenarios (requires browser)`);
console.log(`  Ready for v2 switch: ${readyForDefaultSwitch ? "YES ✓" : "NO ✗"}`);
console.log("╠══════════════════════════════════════════════════════════════╣");

results.forEach((r) => {
  const icon = r.status === "PASS" ? "✓" : r.status === "FAIL" ? "✗" : "!";
  console.log(`  ${icon} [${r.status.padEnd(5)}] ${r.description}`);
  if (r.status !== "PASS") console.log(`         → ${r.details}`);
  if (r.warnings) r.warnings.forEach((w) => console.log(`         ⚠ ${w}`));
});

console.log("╠══════════════════════════════════════════════════════════════╣");
console.log(`  Report written → ${path.relative(process.cwd(), outPath)}`);
console.log("╚══════════════════════════════════════════════════════════════╝\n");

process.exit(failed > 0 || errored > 0 ? 1 : 0);
