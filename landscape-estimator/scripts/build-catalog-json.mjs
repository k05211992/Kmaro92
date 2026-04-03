/**
 * Builds public/catalog_v2.json from data/catalog-v2 source files.
 * Run: node scripts/build-catalog-json.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");

function read(rel) {
  return JSON.parse(readFileSync(join(root, rel), "utf8"));
}

const works = read("data/catalog-v2/works.json");
const workVariants = read("data/catalog-v2/work-variants.json");
const materials = read("data/catalog-v2/materials.json");
const materialVariants = read("data/catalog-v2/material-variants.json");

// Build work variant map
const wvByWork = {};
for (const wv of workVariants) {
  if (!wv.isActive) continue;
  if (!wvByWork[wv.workId]) wvByWork[wv.workId] = [];
  wvByWork[wv.workId].push({
    id: wv.id,
    method: wv.executionMethod,
    condition: wv.conditionTag,
    price: wv.effectiveUnitPrice,
    isDefault: wv.isDefault,
  });
}

// Build material variant map
const mvByMat = {};
for (const mv of materialVariants) {
  if (!mv.isActive) continue;
  if (!mvByMat[mv.materialId]) mvByMat[mv.materialId] = [];
  mvByMat[mv.materialId].push({
    id: mv.id,
    name: mv.clientName,
    price: mv.pricePerUnit,
    unit: mv.purchaseUnit,
    isDefault: mv.isDefault,
  });
}

// Compact works
const compactWorks = works
  .filter((w) => w.isActive)
  .map((w) => {
    const variants = wvByWork[w.id] || [];
    const defaultVariant = variants.find((v) => v.isDefault) || variants[0];
    return {
      id: w.id,
      name: w.canonicalName,
      section: w.section,
      subsection: w.subsection || "",
      unit: w.unit,
      price: defaultVariant?.price ?? w.basePrice,
      variants: variants.length > 1 ? variants : undefined,
    };
  });

// Compact materials
const compactMaterials = materials
  .filter((m) => m.isActive)
  .map((m) => {
    const variants = mvByMat[m.id] || [];
    const defaultVariant = variants.find((v) => v.isDefault) || variants[0];
    return {
      id: m.id,
      name: m.canonicalName,
      section: m.section,
      subsection: m.subsection || "",
      unit: m.baseUnit,
      price: defaultVariant?.price ?? 0,
      variants: variants.length > 1 ? variants : undefined,
    };
  });

const catalog = {
  version: "2",
  generatedAt: new Date().toISOString().slice(0, 10),
  works: compactWorks,
  materials: compactMaterials,
};

const out = join(root, "public/catalog_v2.json");
writeFileSync(out, JSON.stringify(catalog, null, 2), "utf8");
console.log(`✓ catalog_v2.json — ${compactWorks.length} работ, ${compactMaterials.length} материалов`);
