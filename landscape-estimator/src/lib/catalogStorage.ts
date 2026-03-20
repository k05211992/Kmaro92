import type { Catalog, CatalogCategory, CatalogMaterial, CatalogCoefficient, CatalogExtraCostPreset } from "@/types";
import pricingJson from "@/config/pricing.json";
import materialsJson from "@/config/materials.json";

const CATALOG_KEY = "landscape_catalog_v1";

// ─── Seed ────────────────────────────────────────────────────────────────────

function buildSeedCatalog(): Catalog {
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

// ─── Public API ───────────────────────────────────────────────────────────────

export function getCatalog(): Catalog {
  if (typeof window === "undefined") return buildSeedCatalog();
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
