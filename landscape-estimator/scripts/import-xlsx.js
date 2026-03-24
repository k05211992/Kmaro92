#!/usr/bin/env node
/**
 * import-xlsx.js
 * Reads KP_Generator_Template_v6_real_import.xlsx and writes catalog-v2 JSON files.
 * Run: npm run import:catalog
 *
 * Output directory: data/catalog-v2/
 * Does NOT modify src/config/pricing.json or src/config/materials.json.
 */

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, "..");
const XLSX_PATH = path.join(ROOT, "KP_Generator_Template_v6_real_import.xlsx");
const OUT_DIR = path.join(ROOT, "data", "catalog-v2");

const REQUIRED_SHEETS = [
  "WORK_MASTER_REAL",
  "WORK_VARIANTS_REAL",
  "MATERIAL_MASTER_REAL",
  "MATERIAL_VARIANTS_REAL",
  "RAW_MAPPING_REAL",
  "REAL_GAPS",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function readSheet(wb, name) {
  const ws = wb.Sheets[name];
  if (!ws) throw new Error(`Sheet "${name}" not found in workbook`);
  return XLSX.utils.sheet_to_json(ws, { defval: null });
}

function isActive(row, field = "IsActive") {
  const v = row[field];
  if (v === null || v === undefined) return true; // treat missing as active
  return String(v).trim().toLowerCase() === "да" || String(v).trim().toLowerCase() === "yes" || v === true;
}

function notEmpty(v) {
  return v !== null && v !== undefined && String(v).trim() !== "";
}

function writeJson(filename, data) {
  const dest = path.join(OUT_DIR, filename);
  fs.writeFileSync(dest, JSON.stringify(data, null, 2), "utf8");
  return dest;
}

// ── Validation ────────────────────────────────────────────────────────────────

const validationErrors = [];

function validate(entityType, row, requiredFields) {
  for (const f of requiredFields) {
    if (!notEmpty(row[f])) {
      validationErrors.push({
        sheet: entityType,
        id: row.WorkID || row.MaterialID || row.VariantID || row.SourceRowID || "?",
        field: f,
        issue: "missing or empty",
      });
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  // 1. Check Excel file
  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`ERROR: File not found: ${XLSX_PATH}`);
    process.exit(1);
  }

  // 2. Ensure output dir
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log("Reading:", XLSX_PATH);
  const wb = XLSX.readFile(XLSX_PATH);

  // 3. Check required sheets
  const missingSheets = REQUIRED_SHEETS.filter((s) => !wb.SheetNames.includes(s));
  if (missingSheets.length > 0) {
    console.error("ERROR: Missing sheets:", missingSheets.join(", "));
    process.exit(1);
  }
  console.log("Sheets found:", REQUIRED_SHEETS.join(", "));

  // ── WORKS ──────────────────────────────────────────────────────────────────

  const rawWorks = readSheet(wb, "WORK_MASTER_REAL");
  const works = [];
  for (const row of rawWorks) {
    validate("WORK_MASTER_REAL", row, ["WorkID", "CanonicalWork", "Section", "Unit"]);
    if (!notEmpty(row.WorkID) || !notEmpty(row.CanonicalWork)) continue;
    works.push({
      id: String(row.WorkID).trim(),
      canonicalName: String(row.CanonicalWork).trim(),
      commercialName: notEmpty(row.CommercialName) ? String(row.CommercialName).trim() : null,
      section: notEmpty(row.Section) ? String(row.Section).trim() : "Прочее",
      subsection: notEmpty(row.Subsection) ? String(row.Subsection).trim() : null,
      positionType: notEmpty(row.PositionType) ? String(row.PositionType).trim() : null,
      unit: notEmpty(row.Unit) ? String(row.Unit).trim() : "ед.",
      pricingModel: notEmpty(row.PricingModel) ? String(row.PricingModel).trim() : null,
      basePrice: row.BasePrice != null ? Number(row.BasePrice) : null,
      clientDisplayMode: notEmpty(row.ClientDisplayMode) ? String(row.ClientDisplayMode).trim() : null,
      keywords: notEmpty(row.Keywords) ? String(row.Keywords).trim() : null,
      isActive: isActive(row),
      tariffSensitive: notEmpty(row.TariffSensitive) ? String(row.TariffSensitive).trim() === "Да" : false,
      mappingConfidence: notEmpty(row.MappingConfidence) ? String(row.MappingConfidence).trim() : null,
      sourceRowsCount: row.SourceRowsCount != null ? Number(row.SourceRowsCount) : null,
      exampleSourceRowId: notEmpty(row.ExampleSourceRowID) ? String(row.ExampleSourceRowID).trim() : null,
    });
  }

  // ── WORK VARIANTS ──────────────────────────────────────────────────────────

  const rawWorkVariants = readSheet(wb, "WORK_VARIANTS_REAL");
  const workVariants = [];
  for (const row of rawWorkVariants) {
    validate("WORK_VARIANTS_REAL", row, ["VariantID", "WorkID", "EffectiveUnitPrice"]);
    if (!notEmpty(row.VariantID) || !notEmpty(row.WorkID)) continue;
    workVariants.push({
      id: String(row.VariantID).trim(),
      workId: String(row.WorkID).trim(),
      executionMethod: notEmpty(row.ExecutionMethod) ? String(row.ExecutionMethod).trim() : null,
      conditionTag: notEmpty(row.ConditionTag) ? String(row.ConditionTag).trim() : null,
      methodCoeff: row.MethodCoeff != null ? Number(row.MethodCoeff) : 1,
      conditionCoeff: row.ConditionCoeff != null ? Number(row.ConditionCoeff) : 1,
      manualOverridePrice: row.ManualOverridePrice != null ? Number(row.ManualOverridePrice) : null,
      effectiveUnitPrice: row.EffectiveUnitPrice != null ? Number(row.EffectiveUnitPrice) : null,
      isDefault: notEmpty(row.IsDefault) ? String(row.IsDefault).trim() === "Да" : false,
      isActive: isActive(row),
    });
  }

  // ── MATERIALS ──────────────────────────────────────────────────────────────

  const rawMaterials = readSheet(wb, "MATERIAL_MASTER_REAL");
  const materials = [];
  for (const row of rawMaterials) {
    validate("MATERIAL_MASTER_REAL", row, ["MaterialID", "CanonicalMaterial", "BaseUnit"]);
    if (!notEmpty(row.MaterialID) || !notEmpty(row.CanonicalMaterial)) continue;
    materials.push({
      id: String(row.MaterialID).trim(),
      family: notEmpty(row.MaterialFamily) ? String(row.MaterialFamily).trim() : null,
      canonicalName: String(row.CanonicalMaterial).trim(),
      commercialBaseName: notEmpty(row.CommercialBaseName) ? String(row.CommercialBaseName).trim() : null,
      section: notEmpty(row.Section) ? String(row.Section).trim() : "Прочее",
      subsection: notEmpty(row.Subsection) ? String(row.Subsection).trim() : null,
      positionType: notEmpty(row.PositionType) ? String(row.PositionType).trim() : null,
      baseUnit: notEmpty(row.BaseUnit) ? String(row.BaseUnit).trim() : "ед.",
      materialType: notEmpty(row.MaterialType) ? String(row.MaterialType).trim() : null,
      lengthMm: row.LengthMM != null ? Number(row.LengthMM) : null,
      widthMm: row.WidthMM != null ? Number(row.WidthMM) : null,
      defaultClientDisplayMode: notEmpty(row.DefaultClientDisplayMode)
        ? String(row.DefaultClientDisplayMode).trim()
        : null,
      isActive: isActive(row),
      allowanceGroup: notEmpty(row.AllowanceGroup) ? String(row.AllowanceGroup).trim() : null,
      baseReserveCoeff: row.BaseReserveCoeff != null ? Number(row.BaseReserveCoeff) : 1,
      allowanceCalcMode: notEmpty(row.AllowanceCalcMode) ? String(row.AllowanceCalcMode).trim() : null,
      tariffSensitive: notEmpty(row.TariffSensitive) ? String(row.TariffSensitive).trim() === "Да" : false,
    });
  }

  // ── MATERIAL VARIANTS ──────────────────────────────────────────────────────

  const rawMatVariants = readSheet(wb, "MATERIAL_VARIANTS_REAL");
  const materialVariants = [];
  for (const row of rawMatVariants) {
    validate("MATERIAL_VARIANTS_REAL", row, ["VariantID", "MaterialID", "PricePerUnit"]);
    if (!notEmpty(row.VariantID) || !notEmpty(row.MaterialID)) continue;
    materialVariants.push({
      id: String(row.VariantID).trim(),
      materialId: String(row.MaterialID).trim(),
      thicknessMm: row.ThicknessMM != null ? Number(row.ThicknessMM) : null,
      color: notEmpty(row.Color) ? String(row.Color).trim() : null,
      surface: notEmpty(row.Surface) ? String(row.Surface).trim() : null,
      edgeType: notEmpty(row.EdgeType) ? String(row.EdgeType).trim() : null,
      loadClass: notEmpty(row.LoadClass) ? String(row.LoadClass).trim() : null,
      manufacturer: notEmpty(row.Manufacturer) ? String(row.Manufacturer).trim() : null,
      pricePerUnit: row.PricePerUnit != null ? Number(row.PricePerUnit) : null,
      clientName: notEmpty(row.ClientName) ? String(row.ClientName).trim() : null,
      clientDisplayMode: notEmpty(row.ClientDisplayMode) ? String(row.ClientDisplayMode).trim() : null,
      isDefault: notEmpty(row.IsDefault) ? String(row.IsDefault).trim() === "Да" : false,
      isActive: isActive(row),
      purchaseUnit: notEmpty(row.PurchaseUnit) ? String(row.PurchaseUnit).trim() : null,
      coveragePerPurchaseUnit: row.CoveragePerPurchaseUnit != null ? Number(row.CoveragePerPurchaseUnit) : null,
      coverageUnit: notEmpty(row.CoverageUnit) ? String(row.CoverageUnit).trim() : null,
      supplier: notEmpty(row.Supplier) ? String(row.Supplier).trim() : null,
      leadTimeDays: row.LeadTimeDays != null ? Number(row.LeadTimeDays) : null,
      priceSource: notEmpty(row.PriceSource) ? String(row.PriceSource).trim() : null,
      priceValidFrom: notEmpty(row.PriceValidFrom) ? String(row.PriceValidFrom).trim() : null,
      priceValidTo: notEmpty(row.PriceValidTo) ? String(row.PriceValidTo).trim() : null,
      taxMode: notEmpty(row.TaxMode) ? String(row.TaxMode).trim() : null,
      moq: row.MOQ != null ? Number(row.MOQ) : null,
      orderStepQty: row.OrderStepQty != null ? Number(row.OrderStepQty) : null,
      mappingConfidence: notEmpty(row.MappingConfidence) ? String(row.MappingConfidence).trim() : null,
      sourceRowId: notEmpty(row.SourceRowID) ? String(row.SourceRowID).trim() : null,
    });
  }

  // ── RAW MAPPING ────────────────────────────────────────────────────────────

  const rawMapping = readSheet(wb, "RAW_MAPPING_REAL");
  const mappingRows = [];
  for (const row of rawMapping) {
    if (!notEmpty(row.SourceRowID)) continue;
    mappingRows.push({
      sourceRowId: String(row.SourceRowID).trim(),
      rawName: notEmpty(row.RawName) ? String(row.RawName).trim() : null,
      sourceSheet: notEmpty(row.SourceSheet) ? String(row.SourceSheet).trim() : null,
      sourceRowNumber: row.SourceRowNumber != null ? Number(row.SourceRowNumber) : null,
      sourceSection: notEmpty(row.SourceSection) ? String(row.SourceSection).trim() : null,
      entityType: notEmpty(row.EntityType) ? String(row.EntityType).trim() : null,
      masterId: notEmpty(row.MasterID) ? String(row.MasterID).trim() : null,
      variantId: notEmpty(row.VariantID) ? String(row.VariantID).trim() : null,
      mappingConfidence: notEmpty(row.MappingConfidence) ? String(row.MappingConfidence).trim() : null,
      mappingStatus: notEmpty(row.MappingStatus) ? String(row.MappingStatus).trim() : null,
      needsReview: notEmpty(row.NeedsReview) ? String(row.NeedsReview).trim() === "Да" : false,
      notes: notEmpty(row.Notes) ? String(row.Notes).trim() : null,
    });
  }

  // ── REAL GAPS ──────────────────────────────────────────────────────────────

  const rawGaps = readSheet(wb, "REAL_GAPS");
  const reviewGaps = [];
  for (const row of rawGaps) {
    if (!notEmpty(row.SourceRowID)) continue;
    reviewGaps.push({
      sourceRowId: String(row.SourceRowID).trim(),
      rawName: notEmpty(row.RawName) ? String(row.RawName).trim() : null,
      sourceFile: notEmpty(row.SourceFile) ? String(row.SourceFile).trim() : null,
      recommendedSection: notEmpty(row.RecommendedSection) ? String(row.RecommendedSection).trim() : null,
      positionType: notEmpty(row.PositionType) ? String(row.PositionType).trim() : null,
      mappingConfidence: notEmpty(row.MappingConfidence) ? String(row.MappingConfidence).trim() : null,
      whyReview: notEmpty(row.WhyReview) ? String(row.WhyReview).trim() : null,
      comment: notEmpty(row.Comment) ? String(row.Comment).trim() : null,
    });
  }

  // ── Write JSON files ───────────────────────────────────────────────────────

  const activeWorks = works.filter((w) => w.isActive);
  const activeWorkVariants = workVariants.filter((v) =>
    v.isActive && activeWorks.some((w) => w.id === v.workId)
  );
  const activeMaterials = materials.filter((m) => m.isActive);
  const activeMaterialVariants = materialVariants.filter((v) =>
    v.isActive && activeMaterials.some((m) => m.id === v.materialId)
  );

  writeJson("works.json", works);
  writeJson("work-variants.json", workVariants);
  writeJson("materials.json", materials);
  writeJson("material-variants.json", materialVariants);
  writeJson("raw-mapping.json", mappingRows);
  writeJson("review-gaps.json", reviewGaps);

  // ── Migration report ───────────────────────────────────────────────────────

  const workSections = [...new Set(works.map((w) => w.section))].sort();
  const materialSections = [...new Set(materials.map((m) => m.section))].sort();

  const report = {
    generatedAt: new Date().toISOString(),
    sourceFile: path.basename(XLSX_PATH),
    sheetsRead: REQUIRED_SHEETS,
    counts: {
      works: {
        total: works.length,
        active: activeWorks.length,
        inactive: works.length - activeWorks.length,
      },
      workVariants: {
        total: workVariants.length,
        active: activeWorkVariants.length,
      },
      materials: {
        total: materials.length,
        active: activeMaterials.length,
        inactive: materials.length - activeMaterials.length,
      },
      materialVariants: {
        total: materialVariants.length,
        active: activeMaterialVariants.length,
      },
      rawMappingRows: mappingRows.length,
      reviewGaps: reviewGaps.length,
    },
    workSections,
    materialSections,
    validation: {
      errors: validationErrors.length,
      errorList: validationErrors,
    },
    outputFiles: [
      "works.json",
      "work-variants.json",
      "materials.json",
      "material-variants.json",
      "raw-mapping.json",
      "review-gaps.json",
    ],
    notes: [
      "src/config/pricing.json and src/config/materials.json were NOT modified.",
      "This is catalog-v2 import only. Runtime still uses v1 until adapter is enabled.",
      `review-gaps.json contains ${reviewGaps.length} rows requiring manual review — do not auto-import.`,
    ],
  };

  writeJson("migration-report.json", report);

  // ── Console summary ────────────────────────────────────────────────────────

  console.log("\n✓ Import complete\n");
  console.log(`  Works         : ${works.length} total, ${activeWorks.length} active`);
  console.log(`  Work variants : ${workVariants.length} total, ${activeWorkVariants.length} active`);
  console.log(`  Materials     : ${materials.length} total, ${activeMaterials.length} active`);
  console.log(`  Mat. variants : ${materialVariants.length} total, ${activeMaterialVariants.length} active`);
  console.log(`  Raw mapping   : ${mappingRows.length} rows`);
  console.log(`  Review gaps   : ${reviewGaps.length} rows (NOT imported to runtime)`);
  console.log(`  Work sections : ${workSections.length} unique sections`);

  if (validationErrors.length > 0) {
    console.warn(`\n⚠  Validation warnings: ${validationErrors.length}`);
    validationErrors.slice(0, 10).forEach((e) =>
      console.warn(`   [${e.sheet}] id=${e.id} field=${e.field}: ${e.issue}`)
    );
    if (validationErrors.length > 10) {
      console.warn(`   ... and ${validationErrors.length - 10} more (see migration-report.json)`);
    }
  } else {
    console.log("  Validation    : no errors");
  }

  console.log(`\n  Output: ${OUT_DIR}`);
  console.log("  src/config/pricing.json   → NOT modified");
  console.log("  src/config/materials.json → NOT modified\n");
}

run();
