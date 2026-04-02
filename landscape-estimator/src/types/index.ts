/** Строковый id категории работ */
export type WorkCategory = string;

export interface WorkInput {
  category: WorkCategory;
  quantity: number;
  variant?: string;
}

// ─── Каталог ─────────────────────────────────────────────────────────────────

export interface CatalogVariant {
  id: string;
  label: string;
  unitPrice: number;
  active?: boolean;
}

export interface CatalogCategory {
  id: string;
  label: string;
  unit: string;
  variants: CatalogVariant[];
  active?: boolean;
  section?: string;
}

export interface CatalogMaterial {
  id: string;
  title: string;
  unit: string;
  defaultPrice: number;
  active?: boolean;
  section?: string;
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

// ─── Разделы сметы (НОВОЕ) ────────────────────────────────────────────────────

/** Тип раздела:
 *  standard    — обычный раздел (работы + материалы)
 *  extra_costs — раздел 14: доп. расходы / вывоз грунта
 *  org_costs   — раздел 15: орг. затраты (%)
 */
export type SectionType = "standard" | "extra_costs" | "org_costs";

/** Статья организационных затрат (раздел 15) */
export interface OrgCostItem {
  id: string;
  title: string;
  type: "percent" | "fixed";
  /** % или фиксированная сумма в рублях */
  value: number;
  note?: string;
}

/** Вычисленная статья орг. затрат */
export interface OrgCostResult {
  item: OrgCostItem;
  amount: number;
}

/** Входной раздел — хранится в State и localStorage */
export interface EstimateSection {
  id: string;
  sectionName: string;
  sectionType: SectionType;
  /** Работы из каталога */
  catalogItems: WorkInput[];
  /** Ручные строки работ */
  manualItems: ManualLine[];
  /** Материалы этого раздела */
  materials: MaterialLine[];
  /** Статьи доп. расходов (только для sectionType=extra_costs) */
  extraItems: ExtraCost[];
  /** Статьи орг. затрат (только для sectionType=org_costs) */
  orgCostItems: OrgCostItem[];
  note?: string;
}

/** Вычисленный раздел — часть Estimate, используется в PrintDoc */
export interface EstimateSectionResult {
  id: string;
  sectionName: string;
  sectionType: SectionType;
  /** Порядковый номер раздела в документе (1-based) */
  sectionIndex: number;
  lines: EstimateLine[];
  manualItems: ManualLine[];
  materials: MaterialLine[];
  extraItems: ExtraCost[];
  orgCostResults: OrgCostResult[];
  /** Итого работы (с коэффициентом + ручные) */
  worksTotal: number;
  /** Итого материалы */
  materialsTotal: number;
  /** Итого раздел */
  sectionTotal: number;
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
  /** Разделы сметы с результатами вычислений */
  sections: EstimateSectionResult[];
  // Плоские поля (производные от sections, для EstimateTable и backward compat)
  lines: EstimateLine[];
  complexityCoeff: number;
  worksSubtotal: number;
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
  // Новый формат
  sections?: EstimateSection[];
  complexityCoeff: number;
  financialTerms?: FinancialTerms;
  total: number;
  // Старый формат (backward compat, только для чтения)
  inputs: WorkInput[];
  materials?: MaterialLine[];
  extraCosts?: ExtraCost[];
  manualWorks?: ManualLine[];
}

export interface EstimateTemplate {
  id: string;
  name: string;
  description?: string;
  // Новый формат
  sections?: EstimateSection[];
  complexityCoeff?: number;
  // Старый формат (backward compat)
  inputs: WorkInput[];
  manualWorks?: ManualLine[];
  materials?: MaterialLine[];
  extraCosts?: ExtraCost[];
  isBuiltIn?: boolean;
  createdAt?: string;
}

// ─── Устаревшие псевдонимы (backward compat) ─────────────────────────────────

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
