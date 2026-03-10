/**
 * Excel reader — converts uploaded .xlsx/.xls file into Plant[]
 * Uses SheetJS (xlsx). Runs client-side via ArrayBuffer.
 */
import * as XLSX from "xlsx";
import type { Plant, ExcelImportResult, StockStatus, LightCondition, MoistureCondition, HeightGroup } from "@/types";

// ---- Column mapping (Excel column name → Plant field) ----
const COLUMN_MAP: Record<string, keyof Plant> = {
  id: "id",
  category: "category",
  subcategory: "subcategory",
  name: "name",
  latin_name: "latin_name",
  variety: "variety",
  size: "size",
  container: "container",
  price_retail: "price_retail",
  price_wholesale: "price_wholesale",
  discount_default: "discount_default",
  stock_qty: "stock_qty",
  stock_status: "stock_status",
  light: "light",
  moisture: "moisture",
  height_group: "height_group",
  frost_zone: "frost_zone",
  lifespan_group: "lifespan_group",
  flower_color: "flower_color",
  leaf_color: "leaf_color",
  natural_garden: "natural_garden",
  medicinal: "medicinal",
  description: "description",
  notes: "notes",
  image_url: "image_url",
};

// ---- Required fields ----
const REQUIRED_FIELDS: (keyof Plant)[] = ["name", "category", "price_retail"];

// ---- Enum validators ----
const VALID_STOCK_STATUS: StockStatus[] = ["in_stock", "low", "order", "out"];
const VALID_LIGHT: LightCondition[] = ["sun", "partial_shade", "shade"];
const VALID_MOISTURE: MoistureCondition[] = ["dry", "moderate", "wet"];
const VALID_HEIGHT: HeightGroup[] = ["under_20", "20_50", "50_100", "over_100"];

// Parse cell value as number safely
function toNumber(val: unknown, fieldName: string, row: number): { value: number; warning?: string } {
  if (val === null || val === undefined || val === "") {
    return { value: 0 };
  }
  const num = Number(val);
  if (isNaN(num)) {
    return {
      value: 0,
      warning: `Строка ${row}: поле "${fieldName}" содержит не число ("${val}"), использован 0`,
    };
  }
  return { value: num };
}

// Parse boolean value
function toBool(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  if (typeof val === "string") {
    const lower = val.toLowerCase().trim();
    return lower === "true" || lower === "1" || lower === "yes" || lower === "да";
  }
  return false;
}

// Normalize stock status
function normalizeStockStatus(val: unknown): StockStatus {
  if (typeof val === "string") {
    const normalized = val.toLowerCase().trim();
    if (VALID_STOCK_STATUS.includes(normalized as StockStatus)) {
      return normalized as StockStatus;
    }
    // Common aliases
    if (normalized.includes("наличи") || normalized === "есть") return "in_stock";
    if (normalized.includes("мало") || normalized.includes("last")) return "low";
    if (normalized.includes("заказ") || normalized === "order") return "order";
    if (normalized.includes("нет") || normalized === "out") return "out";
  }
  return "in_stock";
}

// Normalize light condition
function normalizeLight(val: unknown): LightCondition | undefined {
  if (typeof val !== "string" || !val.trim()) return undefined;
  const v = val.toLowerCase().trim();
  if (VALID_LIGHT.includes(v as LightCondition)) return v as LightCondition;
  if (v.includes("полутень") || v.includes("partial")) return "partial_shade";
  if (v.includes("тень") || v.includes("shade")) return "shade";
  if (v.includes("солнц") || v.includes("sun")) return "sun";
  return undefined;
}

// Normalize moisture
function normalizeMoisture(val: unknown): MoistureCondition | undefined {
  if (typeof val !== "string" || !val.trim()) return undefined;
  const v = val.toLowerCase().trim();
  if (VALID_MOISTURE.includes(v as MoistureCondition)) return v as MoistureCondition;
  if (v.includes("сух") || v.includes("dry")) return "dry";
  if (v.includes("влажн") || v.includes("wet")) return "wet";
  if (v.includes("умер") || v.includes("moder")) return "moderate";
  return undefined;
}

// Normalize height group
function normalizeHeight(val: unknown): HeightGroup | undefined {
  if (typeof val !== "string" || !val.trim()) return undefined;
  const v = val.toLowerCase().trim();
  if (VALID_HEIGHT.includes(v as HeightGroup)) return v as HeightGroup;
  if (v.includes("20_50") || v.includes("20-50")) return "20_50";
  if (v.includes("50_100") || v.includes("50-100")) return "50_100";
  if (v.includes("under_20") || v.includes("до 20")) return "under_20";
  if (v.includes("over_100") || v.includes("100+")) return "over_100";
  return undefined;
}

// ---- Core buffer parser (shared between client upload and server API) ----
export function parseExcelBuffer(buffer: ArrayBuffer): ExcelImportResult {
  const workbook = XLSX.read(buffer, { type: "array" });

  // Use the first sheet
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      plants: [],
      errors: ["Файл не содержит листов"],
      warnings: [],
      total_rows: 0,
      imported_rows: 0,
    };
  }

  const sheet = workbook.Sheets[sheetName];
  // Convert sheet to array of objects (first row = headers)
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false, // parse all as strings, we'll convert manually
  });

  const plants: Plant[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  let rowIndex = 2; // 1-based, row 1 = header

  for (const raw of rawRows) {
    const rowErrors: string[] = [];

    // Map raw keys to lowercase
    const row: Record<string, unknown> = {};
    for (const key of Object.keys(raw)) {
      row[key.toLowerCase().trim()] = raw[key];
    }

    // ---- Check required fields ----
    for (const field of REQUIRED_FIELDS) {
      const colName = field as string;
      if (!row[colName] || String(row[colName]).trim() === "") {
        rowErrors.push(`Строка ${rowIndex}: отсутствует обязательное поле "${field}"`);
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      rowIndex++;
      continue;
    }

    // ---- Parse numeric fields ----
    const priceRetailResult = toNumber(row["price_retail"], "price_retail", rowIndex);
    const priceWholesaleResult = toNumber(row["price_wholesale"], "price_wholesale", rowIndex);
    const discountResult = toNumber(row["discount_default"], "discount_default", rowIndex);
    const stockQtyResult = toNumber(row["stock_qty"], "stock_qty", rowIndex);

    if (priceRetailResult.warning) warnings.push(priceRetailResult.warning);
    if (priceWholesaleResult.warning) warnings.push(priceWholesaleResult.warning);
    if (discountResult.warning) warnings.push(discountResult.warning);
    if (stockQtyResult.warning) warnings.push(stockQtyResult.warning);

    // ---- Build plant object ----
    const plant: Plant = {
      id: String(row["id"] || "").trim() || `plant-${rowIndex}`,
      category: String(row["category"] || "").trim(),
      subcategory: String(row["subcategory"] || "").trim() || undefined,
      name: String(row["name"] || "").trim(),
      latin_name: String(row["latin_name"] || "").trim() || undefined,
      variety: String(row["variety"] || "").trim() || undefined,
      size: String(row["size"] || "").trim() || undefined,
      container: String(row["container"] || "").trim() || undefined,
      price_retail: priceRetailResult.value,
      price_wholesale:
        priceWholesaleResult.value > 0 ? priceWholesaleResult.value : undefined,
      discount_default: discountResult.value,
      stock_qty:
        stockQtyResult.value > 0 ? stockQtyResult.value : undefined,
      stock_status: normalizeStockStatus(row["stock_status"]),
      light: normalizeLight(row["light"]),
      moisture: normalizeMoisture(row["moisture"]),
      height_group: normalizeHeight(row["height_group"]),
      frost_zone: String(row["frost_zone"] || "").trim() || undefined,
      lifespan_group: String(row["lifespan_group"] || "").trim() || undefined,
      flower_color: String(row["flower_color"] || "").trim() || undefined,
      leaf_color: String(row["leaf_color"] || "").trim() || undefined,
      natural_garden: toBool(row["natural_garden"]),
      medicinal: toBool(row["medicinal"]),
      description: String(row["description"] || "").trim() || undefined,
      notes: String(row["notes"] || "").trim() || undefined,
      image_url: String(row["image_url"] || "").trim() || undefined,
    };

    plants.push(plant);
    rowIndex++;
  }

  return {
    plants,
    errors,
    warnings,
    total_rows: rawRows.length,
    imported_rows: plants.length,
  };
}

// ---- Main export (client-side: accepts File) ----
export async function parseExcelFile(file: File): Promise<ExcelImportResult> {
  const buffer = await file.arrayBuffer();
  return parseExcelBuffer(buffer);
}
