import type { Catalog, CatalogCategory, CatalogMaterial, CatalogCoefficient, CatalogExtraCostPreset } from "@/types";
import pricingJson from "@/config/pricing.json";
import materialsJson from "@/config/materials.json";
import { isCatalogV2Active } from "@/lib/catalogV2/featureFlag";
import { V1_WORK_CANONICAL_MAP, V1_MATERIAL_CANONICAL_MAP } from "@/lib/catalogV2/canonicalMap";
import workVariantsDataRaw from "../../data/catalog-v2/work-variants.json";
import materialVariantsDataRaw from "../../data/catalog-v2/material-variants.json";

// ─── Storage keys ─────────────────────────────────────────────────────────────

/** Legacy v1 key — never touched when v2 is active (safe rollback source). */
const CATALOG_KEY_V1 = "landscape_catalog_v1";
/** v2 key — stores user edits made while v2 is active. */
const CATALOG_KEY_V2 = "landscape_catalog_v2";

// ─── V2 price lookup ──────────────────────────────────────────────────────────

interface WorkVariant {
  id: string;
  workId: string;
  effectiveUnitPrice: number;
  isDefault: boolean;
  isActive: boolean;
}

interface MaterialVariant {
  id: string;
  materialId: string;
  pricePerUnit: number | null;
  isDefault: boolean;
  isActive: boolean;
}

const v2WorkVariants = workVariantsDataRaw as unknown as WorkVariant[];
const v2MaterialVariants = materialVariantsDataRaw as unknown as MaterialVariant[];

function getV2WorkPrice(v2WorkId: string): number | null {
  const variant =
    v2WorkVariants.find((v) => v.workId === v2WorkId && v.isDefault && v.isActive) ??
    v2WorkVariants.find((v) => v.workId === v2WorkId && v.isActive);
  if (!variant || variant.effectiveUnitPrice <= 0) return null;
  return variant.effectiveUnitPrice;
}

function getV2MaterialPrice(v2MaterialId: string): number | null {
  const variant =
    v2MaterialVariants.find((v) => v.materialId === v2MaterialId && v.isDefault && v.isActive) ??
    v2MaterialVariants.find((v) => v.materialId === v2MaterialId && v.isActive);
  if (!variant || variant.pricePerUnit == null || variant.pricePerUnit <= 0) return null;
  return variant.pricePerUnit;
}

// ─── Seed builders ────────────────────────────────────────────────────────────

function buildV1SeedCatalog(): Catalog {
  const works: CatalogCategory[] = (pricingJson as any[]).map((cat) => ({
    id: cat.id,
    label: cat.label,
    unit: cat.unit,
    active: true,
    variants: cat.variants.map((v: any) => ({
      id: v.id,
      label: v.label,
      unitPrice: v.unitPrice,
      active: true,
    })),
  }));

  const materials: CatalogMaterial[] = (materialsJson as any[]).map((m, i) => ({
    id: `mat_${i}_${m.title.slice(0, 8).replace(/\s/g, "")}`,
    title: m.title,
    unit: m.unit,
    defaultPrice: m.defaultPrice,
    active: true,
  }));

  const coefficients: CatalogCoefficient[] = [
    {
      id: "complexity",
      label: "Коэффициент сложности работ",
      defaultValue: 1.0,
      min: 1.0,
      max: 1.5,
    },
  ];

  const extraCostPresets: CatalogExtraCostPreset[] = [
    { id: "ep_1", title: "Доставка материалов", active: true },
    { id: "ep_2", title: "Вывоз мусора", active: true },
    { id: "ep_3", title: "Аренда техники", active: true },
    { id: "ep_4", title: "Расходники и инструмент", active: true },
    { id: "ep_5", title: "Проектирование", active: true },
    { id: "ep_6", title: "Геодезические работы", active: true },
  ];

  return { works, materials, coefficients, extraCostPresets };
}

/**
 * Build the default catalog using v1 IDs/structure but v2 prices where a
 * canonical mapping exists. Unmapped items keep their v1 prices.
 *
 * This preserves full backward-compatibility with saved estimate history
 * (which stores v1 category+variant IDs) while using up-to-date v2 pricing.
 */
function buildV2SeedCatalog(): Catalog {
  const v1 = buildV1SeedCatalog();

  const works: CatalogCategory[] = v1.works.map((cat) => ({
    ...cat,
    variants: cat.variants.map((variant) => {
      // Look up canonical map for this category:variant pair, then category alone
      const pairKey = `${cat.id}:${variant.id}`;
      const entry = V1_WORK_CANONICAL_MAP[pairKey] ?? V1_WORK_CANONICAL_MAP[cat.id];
      if (entry) {
        const v2Price = getV2WorkPrice(entry.v2WorkId);
        if (v2Price !== null) {
          return { ...variant, unitPrice: v2Price };
        }
      }
      return variant; // no mapping or zero price → keep v1 price
    }),
  }));

  const materials: CatalogMaterial[] = v1.materials.map((mat) => {
    const normKey = mat.title.toLowerCase().trim();
    const entry = V1_MATERIAL_CANONICAL_MAP[normKey];
    if (entry) {
      const v2Price = getV2MaterialPrice(entry.v2MaterialId);
      if (v2Price !== null) {
        return { ...mat, defaultPrice: v2Price };
      }
    }
    return mat; // no mapping → keep v1 price
  });

  return { ...v1, works, materials };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * SSR-safe default catalog — deterministic, no localStorage.
 * Use this for the initial useState value to avoid hydration mismatches.
 * After mount, call getCatalog() to pick up localStorage overrides.
 */
export function getDefaultCatalog(): Catalog {
  return buildV2SeedCatalog();
}

export function getCatalog(): Catalog {
  if (typeof window === "undefined") {
    return isCatalogV2Active() ? buildV2SeedCatalog() : buildV1SeedCatalog();
  }

  const activeKey = isCatalogV2Active() ? CATALOG_KEY_V2 : CATALOG_KEY_V1;
  try {
    const raw = localStorage.getItem(activeKey);
    if (raw) return JSON.parse(raw) as Catalog;
  } catch {
    /* ignore */
  }
  return isCatalogV2Active() ? buildV2SeedCatalog() : buildV1SeedCatalog();
}

export function saveCatalog(catalog: Catalog): void {
  const activeKey = isCatalogV2Active() ? CATALOG_KEY_V2 : CATALOG_KEY_V1;
  try {
    localStorage.setItem(activeKey, JSON.stringify(catalog));
  } catch {
    /* ignore */
  }
}

export function resetCatalog(): Catalog {
  const seed = isCatalogV2Active() ? buildV2SeedCatalog() : buildV1SeedCatalog();
  saveCatalog(seed);
  return seed;
}

export function exportCatalogJSON(catalog: Catalog): void {
  const json = JSON.stringify(catalog, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `landscape-catalog-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Price source map ─────────────────────────────────────────────────────────

export type PriceSourceEntry = {
  type: "v2" | "v1_fallback";
  id: string;        // RWORK-* / RMAT-* или "v1"
  seedPrice: number; // цена из seed — для детекции ручного изменения
};

export type PriceSourceMap = {
  works: Record<string, PriceSourceEntry>;     // ключ: "catId:variantId"
  materials: Record<string, PriceSourceEntry>; // ключ: mat.id
};

/**
 * Возвращает фактический источник цены для каждой позиции seed-каталога.
 * Прогоняет ту же логику, что buildV2SeedCatalog():
 *   canonical map + getV2WorkPrice / getV2MaterialPrice.
 * Не читает localStorage. Не меняет никакого состояния.
 */
export function getPriceSourceMap(): PriceSourceMap {
  const v1 = buildV1SeedCatalog();
  const works: Record<string, PriceSourceEntry> = {};
  const materials: Record<string, PriceSourceEntry> = {};

  for (const cat of v1.works) {
    for (const variant of cat.variants) {
      const pairKey = `${cat.id}:${variant.id}`;
      const entry = V1_WORK_CANONICAL_MAP[pairKey] ?? V1_WORK_CANONICAL_MAP[cat.id];
      if (entry) {
        const v2Price = getV2WorkPrice(entry.v2WorkId);
        if (v2Price !== null) {
          works[pairKey] = { type: "v2", id: entry.v2WorkId, seedPrice: v2Price };
          continue;
        }
      }
      works[pairKey] = { type: "v1_fallback", id: "v1", seedPrice: variant.unitPrice };
    }
  }

  for (const mat of v1.materials) {
    const normKey = mat.title.toLowerCase().trim();
    const entry = V1_MATERIAL_CANONICAL_MAP[normKey];
    if (entry) {
      const v2Price = getV2MaterialPrice(entry.v2MaterialId);
      if (v2Price !== null) {
        materials[mat.id] = { type: "v2", id: entry.v2MaterialId, seedPrice: v2Price };
        continue;
      }
    }
    materials[mat.id] = { type: "v1_fallback", id: "v1", seedPrice: mat.defaultPrice };
  }

  return { works, materials };
}
