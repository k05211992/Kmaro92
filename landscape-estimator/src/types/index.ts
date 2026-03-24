/** Строковый id категории работ. Встроенные: "lawn" | "paving" | "curb" | "drainage" | "planting" | "irrigation" | "lighting" */
export type WorkCategory = string;

export interface WorkInput {
  category: WorkCategory;
  quantity: number;
  variant?: string;
}

// ─── Каталог (динамические данные) ──────────────────────────────────────────

export interface CatalogVariant {
  id: string;
  label: string;
  unitPrice: number;
  /** undefined = активна */
  active?: boolean;
}

export interface CatalogCategory {
  id: string;
  label: string;
  unit: string;
  variants: CatalogVariant[];
  /** undefined = активна */
  active?: boolean;
}

export interface CatalogMaterial {
  id: string;
  title: string;
  unit: string;
  defaultPrice: number;
  active?: boolean;
}

export interface CatalogCoefficient {
  id: string;
  label: string;
  defaultValue: number;
  min: number;
  max: number;
}

export interface CatalogExtraCostPreset {
  id: string;
  title: string;
  active?: boolean;
}

export interface Catalog {
  works: CatalogCategory[];
  materials: CatalogMaterial[];
  coefficients: CatalogCoefficient[];
  extraCostPresets: CatalogExtraCostPreset[];
}

// ─── Устаревшие — оставлены для совместимости ────────────────────────────────

/** @deprecated Используйте CatalogVariant */
export interface PricingVariant {
  id: string;
  label: string;
  unitPrice: number;
}

/** @deprecated Используйте CatalogCategory */
export interface PricingCategory {
  id: string;
  label: string;
  unit: string;
  variants: PricingVariant[];
}

// ─── Строки сметы ────────────────────────────────────────────────────────────

export interface EstimateLine {
  category: WorkCategory;
  categoryLabel: string;
  variant: string;
  variantLabel: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

/** Ручная строка — используется в разделе работ, материалов, доп. расходов */
export interface ManualLine {
  id: string;
  title: string;
  unit?: string;
  quantity: number;
  price: number;
  subtotal: number;
  comment?: string;
  isManual: true;
}

export interface MaterialLine {
  id: string;
  title: string;
  unit: string;
  quantity: number;
  price: number;
  subtotal: number;
  comment?: string;
}

export interface ExtraCost {
  id: string;
  title: string;
  amount: number;
  comment?: string;
}

// ─── Финансы ─────────────────────────────────────────────────────────────────

export type DiscountMarkupType = "percent" | "fixed";

export interface FinancialTerms {
  markupType: DiscountMarkupType;
  markupValue: number;
  discountType: DiscountMarkupType;
  discountValue: number;
  minimumOrderAmount: number;
  prepaymentPercent: number;
}

export const DEFAULT_FINANCIAL_TERMS: FinancialTerms = {
  markupType: "percent",
  markupValue: 0,
  discountType: "percent",
  discountValue: 0,
  minimumOrderAmount: 0,
  prepaymentPercent: 0,
};

export interface EstimateSummary {
  worksSubtotal: number;
  worksTotal: number;
  manualWorksSubtotal: number;
  materialsSubtotal: number;
  extraCostsTotal: number;
  baseTotal: number;
  markupAmount: number;
  afterMarkup: number;
  discountAmount: number;
  adjustedTotal: number;
  finalTotal: number;
  minimumApplied: boolean;
  prepaymentAmount: number;
  remainingAmount: number;
}

export interface Estimate {
  lines: EstimateLine[];
  worksSubtotal: number;
  complexityCoeff: number;
  worksTotal: number;
  manualWorks: ManualLine[];
  manualWorksSubtotal: number;
  materials: MaterialLine[];
  materialsSubtotal: number;
  extraCosts: ExtraCost[];
  extraCostsTotal: number;
  financialTerms: FinancialTerms;
  summary: EstimateSummary;
  total: number;
  subtotal: number;
  createdAt: string;
}

export interface ProjectMeta {
  clientName: string;
  phone?: string;
  address: string;
  note: string;
}

export interface SavedEstimate {
  id: string;
  createdAt: string;
  meta: ProjectMeta;
  inputs: WorkInput[];
  complexityCoeff: number;
  materials?: MaterialLine[];
  extraCosts?: ExtraCost[];
  manualWorks?: ManualLine[];
  financialTerms?: FinancialTerms;
  total: number;
}

export interface EstimateTemplate {
  id: string;
  name: string;
  description?: string;
  inputs: WorkInput[];
  manualWorks?: ManualLine[];
  materials?: MaterialLine[];
  extraCosts?: ExtraCost[];
  complexityCoeff?: number;
  isBuiltIn?: boolean;
  createdAt?: string;
}
