import type { Catalog, CatalogCategory, CatalogMaterial, CatalogCoefficient, CatalogExtraCostPreset } from "@/types";
import workMasterDataRaw from "../../data/catalog-v2/work-master.json";
import materialMasterDataRaw from "../../data/catalog-v2/material-master.json";

// ─── Storage keys ─────────────────────────────────────────────────────────────

const CATALOG_KEY = "landscape_catalog_v2";

// ─── Master file types ────────────────────────────────────────────────────────

interface WorkMasterEntry {
  id: string;
  label: string;
  section: string;
  unit: string;
  basePrice: number;
}

interface MaterialMasterEntry {
  id: string;
  label: string;
  section: string;
  unit: string;
  defaultPrice: number;
}

const workMaster = workMasterDataRaw as WorkMasterEntry[];
const materialMaster = materialMasterDataRaw as MaterialMasterEntry[];

// ─── Seed builder ─────────────────────────────────────────────────────────────

function buildSeedCatalog(): Catalog {
  const works: CatalogCategory[] = workMaster.map((w) => ({
    id: w.id,
    label: w.label,
    unit: w.unit,
    section: w.section,
    active: true,
    variants: [
      {
        id: w.id,
        label: w.label,
        unitPrice: w.basePrice,
        active: true,
      },
    ],
  }));

  const materials: CatalogMaterial[] = materialMaster.map((m) => ({
    id: m.id,
    title: m.label,
    unit: m.unit,
    defaultPrice: m.defaultPrice,
    section: m.section,
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

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * SSR-safe default catalog — deterministic, no localStorage.
 * Use this for the initial useState value to avoid hydration mismatches.
 * After mount, call getCatalog() to pick up localStorage overrides.
 */
export function getDefaultCatalog(): Catalog {
  return buildSeedCatalog();
}

export function getCatalog(): Catalog {
  if (typeof window === "undefined") {
    return buildSeedCatalog();
  }
  try {
    const raw = localStorage.getItem(CATALOG_KEY);
    if (raw) return JSON.parse(raw) as Catalog;
  } catch {
    /* ignore */
  }
  return buildSeedCatalog();
}

export function saveCatalog(catalog: Catalog): void {
  try {
    localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog));
  } catch {
    /* ignore */
  }
}

export function resetCatalog(): Catalog {
  const seed = buildSeedCatalog();
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
  id: string;
  seedPrice: number;
};

export type PriceSourceMap = {
  works: Record<string, PriceSourceEntry>;     // ключ: "catId:variantId"
  materials: Record<string, PriceSourceEntry>; // ключ: mat.id
};

/**
 * Returns the price source for each catalog entry.
 * All entries from the master catalog are type "v2".
 */
export function getPriceSourceMap(): PriceSourceMap {
  const works: Record<string, PriceSourceEntry> = {};
  const materials: Record<string, PriceSourceEntry> = {};

  for (const w of workMaster) {
    works[`${w.id}:${w.id}`] = { type: "v2", id: w.id, seedPrice: w.basePrice };
  }

  for (const m of materialMaster) {
    materials[m.id] = { type: "v2", id: m.id, seedPrice: m.defaultPrice };
  }

  return { works, materials };
}
