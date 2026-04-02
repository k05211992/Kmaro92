/**
 * Верификация расчётов сметы — зеркало логики calc.ts
 * Запуск: node scripts/verify-calc.mjs
 */

const rub = (n) => n.toLocaleString("ru-RU") + " ₽";
const pct = (n) => n.toLocaleString("ru-RU", { maximumFractionDigits: 2 }) + "%";

// ─── Входные данные (из test-seed.html) ──────────────────────────────────────

const COEFF = 1.1;

// Раздел 1: Газон и мощение
const s1_catalog = [
  { label: "Рулонный газон",    unit: "м²",     qty: 250, price: 450  },
  { label: "Тротуарная плитка", unit: "м²",     qty: 40,  price: 900  },
  { label: "Бетонный бордюр",   unit: "пог.м",  qty: 60,  price: 380  },
];
const s1_manual = [
  { label: "Снятие и вывоз дёрна", qty: 250, price: 120, subtotal: 30_000 },
];
const s1_materials = [
  { label: "Рулонный газон",          qty: 260, price: 350,   subtotal: 91_000  },
  { label: "Тротуарная плитка 40×40", qty: 42,  price: 1_200, subtotal: 50_400  },
  { label: "Бордюрный камень",        qty: 120, price: 85,    subtotal: 10_200  },
];

// Раздел 2: Посадочные работы
const s2_catalog = [
  { label: "Деревья (до 2м)",  unit: "шт", qty: 5,  price: 2_500 },
  { label: "Кустарники",       unit: "шт", qty: 15, price: 800   },
  { label: "Многолетники",     unit: "шт", qty: 80, price: 350   },
];
const s2_manual = [];
const s2_materials = [
  { label: "Почвогрунт",  qty: 8,  price: 3_200, subtotal: 25_600 },
  { label: "Удобрение",   qty: 12, price: 780,   subtotal: 9_360  },
];

// Раздел 14: Доп. расходы
const s14_items = [
  { label: "Вывоз строительного мусора", amount: 18_000 },
  { label: "Аренда мини-экскаватора",    amount: 24_000 },
  { label: "Доставка материалов",        amount: 8_500  },
];

// Раздел 15: Орг. затраты (% от standardBase)
const s15_items = [
  { label: "Накладные расходы",      type: "percent", value: 5 },
  { label: "Непредвиденные расходы", type: "percent", value: 3 },
];

// Финансовые условия
const financialTerms = {
  markupValue: 0,   markupType: "percent",
  discountValue: 5, discountType: "percent",
  minimumOrderAmount: 0,
  prepaymentPercent: 30,
};

// ─── Расчёт (зеркало calc.ts) ────────────────────────────────────────────────

console.log("═".repeat(60));
console.log("  ВЕРИФИКАЦИЯ РАСЧЁТА СМЕТЫ");
console.log("  Коэффициент сложности:", COEFF);
console.log("═".repeat(60));

// --- Раздел 1 ---
const s1_linesSubtotal = s1_catalog.reduce((s, l) => s + l.qty * l.price, 0);
const s1_linesWithCoeff = Math.round(s1_linesSubtotal * COEFF);
const s1_manualSubtotal = s1_manual.reduce((s, m) => s + m.subtotal, 0);
const s1_worksTotal = s1_linesWithCoeff + s1_manualSubtotal;
const s1_matsTotal = s1_materials.reduce((s, m) => s + m.subtotal, 0);
const s1_total = s1_worksTotal + s1_matsTotal;

console.log("\n┌─ Раздел 1: Газон и мощение");
s1_catalog.forEach(l => console.log(`│  ${l.qty} ${l.unit} × ${rub(l.price)} = ${rub(l.qty * l.price)}  (${l.label})`));
console.log(`│  Σ каталог (без коэф.) = ${rub(s1_linesSubtotal)}`);
console.log(`│  × ${COEFF} → ${rub(s1_linesWithCoeff)}  [Math.round(${s1_linesSubtotal} × ${COEFF})]`);
console.log(`│  + ручная строка (${s1_manual[0].label}): ${rub(s1_manualSubtotal)}`);
console.log(`│  РАБОТЫ итого: ${rub(s1_worksTotal)}`);
console.log(`│  МАТЕРИАЛЫ: ${rub(s1_matsTotal)}`);
console.log(`└  РАЗДЕЛ 1 ИТОГО: ${rub(s1_total)}`);

// --- Раздел 2 ---
const s2_linesSubtotal = s2_catalog.reduce((s, l) => s + l.qty * l.price, 0);
const s2_linesWithCoeff = Math.round(s2_linesSubtotal * COEFF);
const s2_manualSubtotal = 0;
const s2_worksTotal = s2_linesWithCoeff + s2_manualSubtotal;
const s2_matsTotal = s2_materials.reduce((s, m) => s + m.subtotal, 0);
const s2_total = s2_worksTotal + s2_matsTotal;

console.log("\n┌─ Раздел 2: Посадочные работы");
s2_catalog.forEach(l => console.log(`│  ${l.qty} ${l.unit} × ${rub(l.price)} = ${rub(l.qty * l.price)}  (${l.label})`));
console.log(`│  Σ каталог (без коэф.) = ${rub(s2_linesSubtotal)}`);
console.log(`│  × ${COEFF} → ${rub(s2_linesWithCoeff)}  [Math.round(${s2_linesSubtotal} × ${COEFF})]`);
console.log(`│  РАБОТЫ итого: ${rub(s2_worksTotal)}`);
console.log(`│  МАТЕРИАЛЫ: ${rub(s2_matsTotal)}`);
console.log(`└  РАЗДЕЛ 2 ИТОГО: ${rub(s2_total)}`);

// --- Раздел 14 ---
const s14_total = s14_items.reduce((s, e) => s + e.amount, 0);
console.log("\n┌─ Раздел 14: Доп. расходы");
s14_items.forEach(e => console.log(`│  ${e.label}: ${rub(e.amount)}`));
console.log(`└  РАЗДЕЛ 14 ИТОГО: ${rub(s14_total)}`);

// --- БАЗА для Раздела 15 ---
// standardBase = сумма только standard-разделов (работы + материалы)
// НЕ включает extra_costs, и сам org_costs-раздел тоже НЕ входит в базу
const standardBase = s1_total + s2_total;
console.log("\n┌─ База для Раздела 15 (только standard-разделы)");
console.log(`│  Раздел 1: ${rub(s1_total)}`);
console.log(`│  Раздел 2: ${rub(s2_total)}`);
console.log(`│  extra_costs и org_costs — НЕ входят в базу`);
console.log(`└  standardBase = ${rub(standardBase)}`);

// --- Раздел 15 ---
const s15_results = s15_items.map(item => ({
  ...item,
  amount: Math.round((standardBase * item.value) / 100),
}));
const s15_total = s15_results.reduce((s, r) => s + r.amount, 0);

console.log("\n┌─ Раздел 15: Орг. затраты");
s15_results.forEach(r =>
  console.log(`│  ${r.label}: ${pct(r.value)} × ${rub(standardBase)} = ${rub(r.amount)}`)
);
console.log(`└  РАЗДЕЛ 15 ИТОГО: ${rub(s15_total)}`);

// --- Глобальные суммы ---
// worksSubtotal = сумма всех catalog-lines без коэф.
const worksSubtotal = s1_linesSubtotal + s2_linesSubtotal;
const linesWithCoeffTotal = Math.round(worksSubtotal * COEFF);
const manualWorksSubtotal = s1_manualSubtotal + s2_manualSubtotal;
const worksTotal = linesWithCoeffTotal + manualWorksSubtotal;
const materialsSubtotal = s1_matsTotal + s2_matsTotal;
const extraCostsTotal = s14_total;
const orgCostsTotal = s15_total;
const baseTotal = worksTotal + materialsSubtotal + extraCostsTotal + orgCostsTotal;

console.log("\n┌─ Глобальные суммы (до финусловий)");
console.log(`│  worksSubtotal (без коэф.): ${rub(worksSubtotal)}`);
console.log(`│  linesWithCoeffTotal (×${COEFF}): ${rub(linesWithCoeffTotal)}`);
console.log(`│  manualWorksSubtotal: ${rub(manualWorksSubtotal)}`);
console.log(`│  worksTotal: ${rub(worksTotal)}`);
console.log(`│  materialsSubtotal: ${rub(materialsSubtotal)}`);
console.log(`│  extraCostsTotal (раздел 14): ${rub(extraCostsTotal)}`);
console.log(`│  orgCostsTotal (раздел 15): ${rub(orgCostsTotal)}`);
console.log(`└  baseTotal: ${rub(baseTotal)}`);

// --- Финансовые условия ---
const markupAmount = financialTerms.markupValue > 0
  ? Math.round((baseTotal * financialTerms.markupValue) / 100) : 0;
const afterMarkup = baseTotal + markupAmount;
const discountAmount = financialTerms.discountValue > 0
  ? Math.round((afterMarkup * financialTerms.discountValue) / 100) : 0;
const adjustedTotal = Math.max(afterMarkup - discountAmount, 0);
const minimumApplied = financialTerms.minimumOrderAmount > 0 && adjustedTotal < financialTerms.minimumOrderAmount;
const finalTotal = minimumApplied ? financialTerms.minimumOrderAmount : adjustedTotal;
const prepaymentAmount = Math.round((finalTotal * financialTerms.prepaymentPercent) / 100);
const remainingAmount = finalTotal - prepaymentAmount;

console.log("\n┌─ Финансовые условия");
if (markupAmount > 0) console.log(`│  + Наценка ${pct(financialTerms.markupValue)}: +${rub(markupAmount)}`);
console.log(`│  afterMarkup: ${rub(afterMarkup)}`);
console.log(`│  - Скидка ${pct(financialTerms.discountValue)}: -${rub(discountAmount)}`);
console.log(`│  adjustedTotal: ${rub(adjustedTotal)}`);
console.log(`│  minimumApplied: ${minimumApplied}`);
console.log(`└  finalTotal (к оплате): ${rub(finalTotal)}`);

console.log("\n┌─ Разбивка платежей");
console.log(`│  Предоплата ${financialTerms.prepaymentPercent}%: ${rub(prepaymentAmount)}`);
console.log(`└  Остаток: ${rub(remainingAmount)}`);

console.log("\n┌─ СВОДНАЯ ТАБЛИЦА (строки /print сводной)");
console.log(`│  1. Газон и мощение:      ${rub(s1_total)}`);
console.log(`│  2. Посадочные работы:    ${rub(s2_total)}`);
console.log(`│  3. Доп. расходы:         ${rub(s14_total)}`);
console.log(`│  4. Орг. затраты:         ${rub(s15_total)}`);
console.log(`│  baseTotal:               ${rub(baseTotal)}`);
console.log(`│  - скидка 5%:             -${rub(discountAmount)}`);
console.log(`└  ИТОГО К ОПЛАТЕ:          ${rub(finalTotal)}`);
console.log("\n✓ Расчёт завершён\n");
