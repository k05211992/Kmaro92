import type {
  WorkInput,
  EstimateLine,
  Estimate,
  CatalogCategory,
  MaterialLine,
  ExtraCost,
  ManualLine,
  FinancialTerms,
  EstimateSummary,
} from "@/types";
import { DEFAULT_FINANCIAL_TERMS } from "@/types";
import pricingJson from "@/config/pricing.json";

/** Каталог по умолчанию (из JSON), используется как fallback */
const DEFAULT_CATALOG = pricingJson as unknown as CatalogCategory[];

// ─── Работы из каталога ──────────────────────────────────────────────────────

export function buildEstimateLine(
  input: WorkInput,
  catalog: CatalogCategory[] = DEFAULT_CATALOG
): EstimateLine | null {
  const cat = catalog.find((c) => c.id === input.category && c.active !== false);
  if (!cat || input.quantity <= 0) return null;

  const activeVariants = cat.variants.filter((v) => v.active !== false);
  const variantId = input.variant ?? activeVariants[0]?.id;
  const variant = activeVariants.find((v) => v.id === variantId);
  if (!variant) return null;

  return {
    category: input.category,
    categoryLabel: cat.label,
    variant: variant.id,
    variantLabel: variant.label,
    quantity: input.quantity,
    unit: cat.unit,
    unitPrice: variant.unitPrice,
    subtotal: input.quantity * variant.unitPrice,
  };
}

// ─── Ручные строки ───────────────────────────────────────────────────────────

export function makeManualLine(overrides: Partial<Omit<ManualLine, "isManual">> = {}): ManualLine {
  return {
    id: crypto.randomUUID(),
    title: "",
    unit: "",
    quantity: 0,
    price: 0,
    subtotal: 0,
    comment: "",
    isManual: true,
    ...overrides,
  };
}

export function updateManualLineSubtotal(line: ManualLine): ManualLine {
  return { ...line, subtotal: line.quantity * line.price };
}

// ─── Материалы ───────────────────────────────────────────────────────────────

export function makeMaterial(overrides: Partial<MaterialLine> = {}): MaterialLine {
  return {
    id: crypto.randomUUID(),
    title: "",
    unit: "шт",
    quantity: 0,
    price: 0,
    subtotal: 0,
    comment: "",
    ...overrides,
  };
}

export function updateMaterialSubtotal(m: MaterialLine): MaterialLine {
  return { ...m, subtotal: m.quantity * m.price };
}

export function calcMaterialSubtotal(materials: MaterialLine[]): number {
  return materials.reduce((sum, m) => sum + m.subtotal, 0);
}

// ─── Доп. расходы ────────────────────────────────────────────────────────────

export function makeExtraCost(overrides: Partial<ExtraCost> = {}): ExtraCost {
  return {
    id: crypto.randomUUID(),
    title: "",
    amount: 0,
    comment: "",
    ...overrides,
  };
}

export function calcExtraCostsTotal(extraCosts: ExtraCost[]): number {
  return extraCosts.reduce((sum, e) => sum + e.amount, 0);
}

// ─── Финансовые условия ──────────────────────────────────────────────────────

export function calcFinancials(
  baseTotal: number,
  terms: FinancialTerms
): Pick<
  EstimateSummary,
  | "markupAmount"
  | "afterMarkup"
  | "discountAmount"
  | "adjustedTotal"
  | "finalTotal"
  | "minimumApplied"
  | "prepaymentAmount"
  | "remainingAmount"
> {
  const markupAmount =
    terms.markupValue <= 0
      ? 0
      : terms.markupType === "percent"
      ? Math.round((baseTotal * terms.markupValue) / 100)
      : Math.round(terms.markupValue);

  const afterMarkup = baseTotal + markupAmount;

  const discountAmount =
    terms.discountValue <= 0
      ? 0
      : terms.discountType === "percent"
      ? Math.round((afterMarkup * terms.discountValue) / 100)
      : Math.round(terms.discountValue);

  const adjustedTotal = Math.max(afterMarkup - discountAmount, 0);

  const minimumApplied =
    terms.minimumOrderAmount > 0 && adjustedTotal < terms.minimumOrderAmount;
  const finalTotal = minimumApplied ? terms.minimumOrderAmount : adjustedTotal;

  const prepaymentAmount =
    terms.prepaymentPercent > 0
      ? Math.round((finalTotal * terms.prepaymentPercent) / 100)
      : 0;

  return {
    markupAmount,
    afterMarkup,
    discountAmount,
    adjustedTotal,
    finalTotal,
    minimumApplied,
    prepaymentAmount,
    remainingAmount: finalTotal - prepaymentAmount,
  };
}

// ─── Сборка сметы ────────────────────────────────────────────────────────────

export function buildEstimate(
  inputs: WorkInput[],
  complexityCoeff: number,
  materials: MaterialLine[] = [],
  extraCosts: ExtraCost[] = [],
  manualWorks: ManualLine[] = [],
  financialTerms: FinancialTerms = DEFAULT_FINANCIAL_TERMS,
  catalog: CatalogCategory[] = DEFAULT_CATALOG
): Estimate {
  const lines = inputs
    .map((input) => buildEstimateLine(input, catalog))
    .filter((l): l is EstimateLine => l !== null);

  const worksSubtotal = lines.reduce((sum, l) => sum + l.subtotal, 0);
  const coeff = Math.min(Math.max(complexityCoeff, 1.0), 1.5);
  const worksTotal = Math.round(worksSubtotal * coeff);

  const manualWorksSubtotal = manualWorks.reduce((sum, m) => sum + m.subtotal, 0);
  const materialsSubtotal = calcMaterialSubtotal(materials);
  const extraCostsTotal = calcExtraCostsTotal(extraCosts);
  const baseTotal = worksTotal + manualWorksSubtotal + materialsSubtotal + extraCostsTotal;

  const financials = calcFinancials(baseTotal, financialTerms);

  const summary: EstimateSummary = {
    worksSubtotal,
    worksTotal,
    manualWorksSubtotal,
    materialsSubtotal,
    extraCostsTotal,
    baseTotal,
    ...financials,
  };

  return {
    lines,
    worksSubtotal,
    complexityCoeff: coeff,
    worksTotal,
    manualWorks,
    manualWorksSubtotal,
    materials,
    materialsSubtotal,
    extraCosts,
    extraCostsTotal,
    financialTerms,
    summary,
    subtotal: worksSubtotal,
    total: summary.finalTotal,
    createdAt: new Date().toISOString(),
  };
}

// ─── Вспомогательные ─────────────────────────────────────────────────────────

export function formatRub(amount: number): string {
  return amount.toLocaleString("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
