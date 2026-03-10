// ============================================================
// DOMAIN TYPES — Nursery Catalog MVP
// ============================================================

// ------- Plant stock status -------
export type StockStatus = "in_stock" | "low" | "order" | "out";

// ------- Light conditions -------
export type LightCondition = "sun" | "partial_shade" | "shade";

// ------- Moisture conditions -------
export type MoistureCondition = "dry" | "moderate" | "wet";

// ------- Height groups -------
export type HeightGroup = "under_20" | "20_50" | "50_100" | "over_100";

// ------- Core Plant entity -------
export interface Plant {
  id: string;
  category: string;
  subcategory?: string;
  name: string;
  latin_name?: string;
  variety?: string;
  size?: string;
  container?: string;
  price_retail: number;
  price_wholesale?: number;
  discount_default: number; // percent, 0–100
  stock_qty?: number;
  stock_status: StockStatus;
  light?: LightCondition;
  moisture?: MoistureCondition;
  height_group?: HeightGroup;
  frost_zone?: string; // e.g. "3", "4-5", "USDA 5"
  lifespan_group?: string;
  flower_color?: string;
  leaf_color?: string;
  natural_garden?: boolean;
  medicinal?: boolean;
  description?: string;
  notes?: string;
  image_url?: string;
}

// ------- Catalog filters -------
export interface CatalogFilters {
  search: string;
  categories: string[]; // selected categories (empty = all)
  light: LightCondition[];
  moisture: MoistureCondition[];
  height_group: HeightGroup[];
  frost_zone: string;
  stock_status: StockStatus[];
  price_min: string; // string to allow empty input
  price_max: string;
}

export const DEFAULT_FILTERS: CatalogFilters = {
  search: "",
  categories: [],
  light: [],
  moisture: [],
  height_group: [],
  frost_zone: "",
  stock_status: [],
  price_min: "",
  price_max: "",
};

// ------- Quote (КП) types -------
export type PriceType = "retail" | "wholesale";

export interface QuoteItem {
  id: string; // unique item id (uuid)
  plant: Plant;
  quantity: number;
  price_type: PriceType;
  discount: number; // override or default from plant
}

export type DeliveryType = "fixed" | "custom" | "none";

export interface QuoteClientInfo {
  name: string;
  phone: string;
  comment: string;
}

export interface Quote {
  items: QuoteItem[];
  client_info: QuoteClientInfo;
  delivery_type: DeliveryType;
  delivery_cost: number; // used when type = 'fixed' or 'custom'
  quote_number: string;
  created_at: Date;
}

// ------- App mode -------
export type AppMode = "manager" | "client";

// ------- Excel import result -------
export interface ExcelImportResult {
  plants: Plant[];
  errors: string[];
  warnings: string[];
  total_rows: number;
  imported_rows: number;
}

// ------- Computed quote totals -------
export interface QuoteTotals {
  subtotal: number; // before discount
  discount_amount: number;
  subtotal_after_discount: number;
  delivery: number;
  total: number;
}

// ------- Label maps for display -------
export const LIGHT_LABELS: Record<LightCondition, string> = {
  sun: "Солнце",
  partial_shade: "Полутень",
  shade: "Тень",
};

export const MOISTURE_LABELS: Record<MoistureCondition, string> = {
  dry: "Сухо",
  moderate: "Умеренно",
  wet: "Влажно",
};

export const HEIGHT_LABELS: Record<HeightGroup, string> = {
  under_20: "До 20 см",
  "20_50": "20–50 см",
  "50_100": "50–100 см",
  over_100: "100+ см",
};

export const STOCK_LABELS: Record<StockStatus, string> = {
  in_stock: "В наличии",
  low: "Мало",
  order: "Под заказ",
  out: "Нет",
};

export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  retail: "Розница",
  wholesale: "Опт",
};

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  fixed: "Фиксированная",
  custom: "Вручную",
  none: "Без доставки",
};
