/**
 * Adapter layer: maps legacy v1 estimate items → catalog-v2 entities.
 *
 * Matching pipeline priority (works):
 *   1. Exact id    — category/variant already contains RWORK-XXXX / LEGACY-WORK-XXXX
 *   2. Canonical   — static "category:variant" → RWORK-XXXX (canonicalMap.ts)
 *   3. Manual remap — data/catalog-v2/manual-remap.json (works section)
 *   4. Normalised title — word-set similarity ≥ threshold (v2 + backfill pool)
 *   5. Legacy key  — explicit "legacyKey" lookup in legacy-backfill-works.json
 *   6. requiresRemap — no match found; reason recorded, price never silently zero
 *
 * Matching pipeline priority (materials):
 *   1. Exact id    — MaterialLine.id contains RMAT-XXXX / LEGACY-MAT-XXXX
 *   2. Canonical   — static lowercase title → RMAT-XXXX (canonicalMap.ts)
 *   3. Manual remap — data/catalog-v2/manual-remap.json (materials section)
 *   4. Normalised title — similarity ≥ threshold (v2 + backfill pool)
 *   5. Legacy title — "legacyTitle" lookup in legacy-backfill-materials.json
 *   6. requiresRemap
 *
 * NOTE: Side-effect-free. Does NOT modify localStorage or any estimate state.
 */

import type { WorkInput, MaterialLine } from "@/types";
import type {
  CatalogV2Work,
  CatalogV2WorkVariant,
  CatalogV2Material,
  CatalogV2MaterialVariant,
  AdaptedWork,
  AdaptedMaterial,
  AdapterReport,
  MatchConfidence,
} from "./types";
import { V1_WORK_CANONICAL_MAP, V1_MATERIAL_CANONICAL_MAP } from "./canonicalMap";
import { normalizeTitle, wordSetSimilarity, SIMILARITY_THRESHOLD } from "./normalize";

// ─── Static v2 catalog data ───────────────────────────────────────────────────
import worksDataRaw from "../../../data/catalog-v2/works.json";
import workVariantsDataRaw from "../../../data/catalog-v2/work-variants.json";
import materialsDataRaw from "../../../data/catalog-v2/materials.json";
import materialVariantsDataRaw from "../../../data/catalog-v2/material-variants.json";

// ─── Manual remap data ────────────────────────────────────────────────────────
import manualRemapRaw from "../../../data/catalog-v2/manual-remap.json";

// ─── Legacy backfill data ─────────────────────────────────────────────────────
import backfillWorksRaw from "../../../data/catalog-v2/legacy-backfill-works.json";
import backfillMaterialsRaw from "../../../data/catalog-v2/legacy-backfill-materials.json";

// ─── Typed casts ──────────────────────────────────────────────────────────────

interface LegacyBackfillWork extends CatalogV2Work {
  legacyKey: string;
  defaultVariantPrice: number;
  source: "legacy-backfill";
  isLegacyCompatible: true;
}

interface LegacyBackfillMaterial extends CatalogV2Material {
  legacyTitle: string;
  defaultVariantPrice: number;
  source: "legacy-backfill";
  isLegacyCompatible: true;
}

interface ManualRemapWork {
  v1CategoryKey: string; // "category:variant" or just "category"
  v2WorkId: string;
  confidence: "exact" | "canonical";
  note?: string;
}

interface ManualRemapMaterial {
  v1Title: string;
  v2MaterialId: string;
  confidence: "exact" | "canonical";
  note?: string;
}

const v2Works = worksDataRaw as unknown as CatalogV2Work[];
const v2WorkVariants = workVariantsDataRaw as unknown as CatalogV2WorkVariant[];
const v2Materials = materialsDataRaw as unknown as CatalogV2Material[];
const v2MaterialVariants = materialVariantsDataRaw as unknown as CatalogV2MaterialVariant[];

const backfillWorks = (backfillWorksRaw as unknown[]).filter(
  (e): e is LegacyBackfillWork =>
    typeof e === "object" && e !== null && "id" in e && "legacyKey" in e
);
const backfillMaterials = (backfillMaterialsRaw as unknown[]).filter(
  (e): e is LegacyBackfillMaterial =>
    typeof e === "object" && e !== null && "id" in e && "legacyTitle" in e
);

const manualRemapWorks: ManualRemapWork[] =
  (manualRemapRaw.works as unknown as ManualRemapWork[]) ?? [];
const manualRemapMaterials: ManualRemapMaterial[] =
  (manualRemapRaw.materials as unknown as ManualRemapMaterial[]) ?? [];

// ─── Lookup helpers ───────────────────────────────────────────────────────────
// allWorks / allMaterials include ONLY the real v2 catalog for normalised-title
// matching. Backfill entries are resolved via explicit legacyKey / legacyTitle
// lookup (step 4), which runs BEFORE normalised-title matching (step 5).
// This prevents false fuzzy matches between unrelated backfill entries.
const allWorks = v2Works;
const allMaterials = v2Materials;

// ─── Synthetic variant resolution ─────────────────────────────────────────────

function resolveWorkVariant(workId: string): {
  variantId: string | null;
  price: number | null;
  unit: string | null;
} {
  // Check real v2 variants first
  const wv =
    v2WorkVariants.find((v) => v.workId === workId && v.isDefault && v.isActive) ??
    v2WorkVariants.find((v) => v.workId === workId && v.isActive);
  if (wv) {
    const work =
      v2Works.find((w) => w.id === workId) ??
      backfillWorks.find((w) => w.id === workId);
    return { variantId: wv.id, price: wv.effectiveUnitPrice, unit: work?.unit ?? null };
  }
  // Try backfill synthetic variant
  const bf = backfillWorks.find((w) => w.id === workId);
  if (bf) {
    return {
      variantId: `${workId}-default`,
      price: bf.defaultVariantPrice,
      unit: bf.unit,
    };
  }
  return { variantId: null, price: null, unit: null };
}

function resolveMaterialVariant(materialId: string): {
  variantId: string | null;
  price: number | null;
  unit: string | null;
} {
  const mv =
    v2MaterialVariants.find(
      (v) => v.materialId === materialId && v.isDefault && v.isActive
    ) ?? v2MaterialVariants.find((v) => v.materialId === materialId && v.isActive);
  if (mv && mv.pricePerUnit != null) {
    const mat =
      v2Materials.find((m) => m.id === materialId) ??
      backfillMaterials.find((m) => m.id === materialId);
    return { variantId: mv.id, price: mv.pricePerUnit, unit: mat?.baseUnit ?? null };
  }
  // Backfill
  const bf = backfillMaterials.find((m) => m.id === materialId);
  if (bf) {
    return {
      variantId: `${materialId}-default`,
      price: bf.defaultVariantPrice,
      unit: bf.baseUnit,
    };
  }
  return { variantId: null, price: null, unit: null };
}

// ─── Normalised title search ───────────────────────────────────────────────────

function findWorkByTitle(label: string): {
  work: CatalogV2Work;
  confidence: MatchConfidence;
} | null {
  let best: CatalogV2Work | null = null;
  let bestScore = 0;
  for (const w of allWorks) {
    if (!w.isActive) continue;
    const score = Math.max(
      wordSetSimilarity(label, w.canonicalName),
      wordSetSimilarity(label, w.keywords ?? "")
    );
    if (score > bestScore) {
      bestScore = score;
      best = w;
    }
  }
  if (!best || bestScore < SIMILARITY_THRESHOLD) return null;
  const confidence: MatchConfidence = bestScore >= 0.85 ? "exact" : "normalized";
  return { work: best, confidence };
}

function findMaterialByTitle(title: string): {
  material: CatalogV2Material;
  confidence: MatchConfidence;
} | null {
  let best: CatalogV2Material | null = null;
  let bestScore = 0;
  for (const m of allMaterials) {
    if (!m.isActive) continue;
    const score = Math.max(
      wordSetSimilarity(title, m.canonicalName),
      wordSetSimilarity(title, m.family ?? "")
    );
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  if (!best || bestScore < SIMILARITY_THRESHOLD) return null;
  const confidence: MatchConfidence = bestScore >= 0.85 ? "exact" : "normalized";
  return { material: best, confidence };
}

// ─── Work adapter ─────────────────────────────────────────────────────────────

function makeWorkResult(
  input: WorkInput,
  variantLabel: string | undefined,
  workId: string,
  confidence: MatchConfidence
): AdaptedWork {
  const work =
    (v2Works.find((w) => w.id === workId) ??
     backfillWorks.find((w) => w.id === workId))!;
  const { variantId, price, unit } = resolveWorkVariant(workId);
  return {
    originalCategory: input.category,
    originalVariant: input.variant,
    originalVariantLabel: variantLabel,
    v2WorkId: workId,
    v2WorkVariantId: variantId,
    v2CanonicalName: work.canonicalName,
    v2Price: price,
    v2Unit: unit,
    confidence,
    requiresRemap: false,
  };
}

export function adaptWork(input: WorkInput, variantLabel?: string): AdaptedWork {
  const { category, variant } = input;
  const canonicalKey = variant ? `${category}:${variant}` : category;
  const searchLabel = variantLabel ?? variant ?? category;

  // ── Step 1: Exact id ──────────────────────────────────────────────────────
  const exactIdPattern = /^(RWORK|LEGACY-WORK)-\d+$/;
  if (exactIdPattern.test(category)) {
    const work =
      v2Works.find((w) => w.id === category && w.isActive) ??
      backfillWorks.find((w) => w.id === category && w.isActive);
    if (work) return makeWorkResult(input, variantLabel, work.id, "exact");
  }

  // ── Step 2: Canonical map ─────────────────────────────────────────────────
  const canonEntry = V1_WORK_CANONICAL_MAP[canonicalKey];
  if (canonEntry) {
    const work = allWorks.find((w) => w.id === canonEntry.v2WorkId && w.isActive);
    if (work) return makeWorkResult(input, variantLabel, work.id, canonEntry.confidence);
  }

  // ── Step 3: Manual remap ──────────────────────────────────────────────────
  const manualEntry = manualRemapWorks.find((r) => r.v1CategoryKey === canonicalKey);
  if (manualEntry) {
    const work = allWorks.find((w) => w.id === manualEntry.v2WorkId && w.isActive);
    if (work) return makeWorkResult(input, variantLabel, work.id, manualEntry.confidence);
  }

  // ── Step 4: Legacy key explicit lookup ───────────────────────────────────
  // Runs BEFORE normalised-title search so that backfill entries are resolved
  // deterministically without polluting the fuzzy-match pool.
  const legacyWork = backfillWorks.find((w) => w.legacyKey === canonicalKey);
  if (legacyWork) {
    return makeWorkResult(input, variantLabel, legacyWork.id, "canonical");
  }

  // ── Step 5: Normalised title (v2 catalog only) ────────────────────────────
  const titleMatch = findWorkByTitle(searchLabel);
  if (titleMatch) {
    return makeWorkResult(input, variantLabel, titleMatch.work.id, titleMatch.confidence);
  }

  // ── Step 6: requiresRemap ─────────────────────────────────────────────────
  return {
    originalCategory: category,
    originalVariant: variant,
    originalVariantLabel: variantLabel,
    v2WorkId: null,
    v2WorkVariantId: null,
    v2CanonicalName: null,
    v2Price: null,
    v2Unit: null,
    confidence: "none",
    requiresRemap: true,
    remapReason: variant
      ? `Пара "${category}:${variant}" не найдена в catalog-v2 и не имеет legacy-backfill`
      : `Категория "${category}" не найдена в catalog-v2`,
  };
}

// ─── Material adapter ─────────────────────────────────────────────────────────

function makeMaterialResult(
  line: MaterialLine,
  materialId: string,
  confidence: MatchConfidence
): AdaptedMaterial {
  const mat =
    (v2Materials.find((m) => m.id === materialId) ??
     backfillMaterials.find((m) => m.id === materialId))!;
  const { variantId, price, unit } = resolveMaterialVariant(materialId);
  return {
    originalId: line.id,
    originalTitle: line.title,
    originalUnit: line.unit,
    originalPrice: line.price,
    v2MaterialId: materialId,
    v2MaterialVariantId: variantId,
    v2CanonicalName: mat.canonicalName,
    v2Price: price,
    v2Unit: unit,
    confidence,
    requiresRemap: false,
  };
}

export function adaptMaterial(line: MaterialLine): AdaptedMaterial {
  const { id: lineId, title } = line;

  // ── Step 1: Exact id ──────────────────────────────────────────────────────
  const exactIdPattern = /^(RMAT|LEGACY-MAT)-\d+$/;
  if (exactIdPattern.test(lineId)) {
    const mat =
      v2Materials.find((m) => m.id === lineId && m.isActive) ??
      backfillMaterials.find((m) => m.id === lineId && m.isActive);
    if (mat) return makeMaterialResult(line, mat.id, "exact");
  }

  // ── Step 2: Canonical map ─────────────────────────────────────────────────
  const normKey = normalizeTitle(title);
  const canonEntry =
    V1_MATERIAL_CANONICAL_MAP[normKey] ??
    V1_MATERIAL_CANONICAL_MAP[title.toLowerCase().trim()];
  if (canonEntry) {
    const mat = allMaterials.find((m) => m.id === canonEntry.v2MaterialId && m.isActive);
    if (mat) return makeMaterialResult(line, mat.id, canonEntry.confidence);
  }

  // ── Step 3: Manual remap ──────────────────────────────────────────────────
  const manualEntry = manualRemapMaterials.find(
    (r) =>
      normalizeTitle(r.v1Title) === normKey ||
      r.v1Title.toLowerCase().trim() === title.toLowerCase().trim()
  );
  if (manualEntry) {
    const mat = allMaterials.find(
      (m) => m.id === manualEntry.v2MaterialId && m.isActive
    );
    if (mat) return makeMaterialResult(line, mat.id, manualEntry.confidence);
  }

  // ── Step 4: Legacy title explicit lookup ─────────────────────────────────
  // Runs BEFORE normalised-title search (same reasoning as works step 4).
  const legacyMat = backfillMaterials.find(
    (m) =>
      normalizeTitle(m.legacyTitle) === normKey ||
      m.legacyTitle.toLowerCase().trim() === title.toLowerCase().trim()
  );
  if (legacyMat) {
    return makeMaterialResult(line, legacyMat.id, "canonical");
  }

  // ── Step 5: Normalised title (v2 catalog only) ────────────────────────────
  const titleMatch = findMaterialByTitle(title);
  if (titleMatch) {
    return makeMaterialResult(line, titleMatch.material.id, titleMatch.confidence);
  }

  // ── Step 6: requiresRemap ─────────────────────────────────────────────────
  return {
    originalId: lineId,
    originalTitle: title,
    originalUnit: line.unit,
    originalPrice: line.price,
    v2MaterialId: null,
    v2MaterialVariantId: null,
    v2CanonicalName: null,
    v2Price: null,
    v2Unit: null,
    confidence: "none",
    requiresRemap: true,
    remapReason: `Материал "${title}" не найден в catalog-v2 и не имеет legacy-backfill`,
  };
}

// ─── Report ───────────────────────────────────────────────────────────────────

/**
 * Run the full adapter over a set of work inputs and material lines,
 * returning a structured report with match statistics.
 *
 * @param workInputs    v1 WorkInput[] from current estimate
 * @param variantLabels optional map "category:variant" → display label
 * @param materialLines v1 MaterialLine[] from current estimate
 */
export function runAdapterReport(
  workInputs: WorkInput[],
  variantLabels: Record<string, string> = {},
  materialLines: MaterialLine[] = []
): AdapterReport {
  const workResults = workInputs.map((input) => {
    const key = input.variant
      ? `${input.category}:${input.variant}`
      : input.category;
    return adaptWork(input, variantLabels[key]);
  });

  const materialResults = materialLines.map(adaptMaterial);

  const count = (
    arr: AdaptedWork[] | AdaptedMaterial[],
    pred: (r: { confidence: MatchConfidence; requiresRemap: boolean }) => boolean
  ) => arr.filter(pred).length;

  return {
    timestamp: new Date().toISOString(),
    worksTotal: workResults.length,
    worksMatched: count(workResults, (r) =>
      !r.requiresRemap && (r.confidence === "exact" || r.confidence === "canonical")
    ),
    worksPartial: count(workResults, (r) => !r.requiresRemap && r.confidence === "normalized"),
    worksRequiresRemap: count(workResults, (r) => r.requiresRemap),
    materialsTotal: materialResults.length,
    materialsMatched: count(materialResults, (r) =>
      !r.requiresRemap && (r.confidence === "exact" || r.confidence === "canonical")
    ),
    materialsPartial: count(materialResults, (r) => !r.requiresRemap && r.confidence === "normalized"),
    materialsRequiresRemap: count(materialResults, (r) => r.requiresRemap),
    workResults,
    materialResults,
  };
}
