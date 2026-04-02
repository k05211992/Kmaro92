import type {
  WorkInput,
  EstimateLine,
  EstimateSection,
  EstimateSectionResult,
  OrgCostResult,
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

const DEFAULT_CATALOG = pricingJson as unknown as CatalogCategory[];

// ─── Строка из каталога ───────────────────────────────────────────────────────

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

// ─── Фабрики строк ────────────────────────────────────────────────────────────

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

// ─── Фабрика раздела ──────────────────────────────────────────────────────────

export function makeSection(
  overrides: Partial<Omit<EstimateSection, "id">> = {}
): EstimateSection {
  return {
    id: crypto.randomUUID(),
    sectionName: "",
    sectionType: "standard",
    catalogItems: [],
    manualItems: [],
    materials: [],
    extraItems: [],
    orgCostItems: [],
    ...overrides,
  };
}

// ─── Финансовые условия ───────────────────────────────────────────────────────

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

// ─── Вычисление раздела ───────────────────────────────────────────────────────

function buildSectionResult(
  section: EstimateSection,
  sectionIndex: number,
  coeff: number,
  standardBase: number,
  catalog: CatalogCategory[]
): EstimateSectionResult {
  if (section.sectionType === "extra_costs") {
    const total = section.extraItems.reduce((s, e) => s + e.amount, 0);
    return {
      id: section.id,
      sectionName: section.sectionName,
      sectionType: "extra_costs",
      sectionIndex,
      lines: [],
      manualItems: [],
      materials: [],
      extraItems: section.extraItems,
      orgCostResults: [],
      worksTotal: total,
      materialsTotal: 0,
      sectionTotal: total,
    };
  }

  if (section.sectionType === "org_costs") {
    const orgCostResults: OrgCostResult[] = section.orgCostItems.map((item) => ({
      item,
      amount:
        item.type === "percent"
          ? Math.round((standardBase * item.value) / 100)
          : Math.round(item.value),
    }));
    const total = orgCostResults.reduce((s, r) => s + r.amount, 0);
    return {
      id: section.id,
      sectionName: section.sectionName,
      sectionType: "org_costs",
      sectionIndex,
      lines: [],
      manualItems: [],
      materials: [],
      extraItems: [],
      orgCostResults,
      worksTotal: 0,
      materialsTotal: 0,
      sectionTotal: total,
    };
  }

  // standard section
  const lines = section.catalogItems
    .map((input) => buildEstimateLine(input, catalog))
    .filter((l): l is EstimateLine => l !== null);

  const linesSubtotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const linesWithCoeff = Math.round(linesSubtotal * coeff);
  const manualSubtotal = section.manualItems.reduce((s, m) => s + m.subtotal, 0);
  const worksTotal = linesWithCoeff + manualSubtotal;
  const materialsTotal = calcMaterialSubtotal(section.materials);

  return {
    id: section.id,
    sectionName: section.sectionName,
    sectionType: "standard",
    sectionIndex,
    lines,
    manualItems: section.manualItems,
    materials: section.materials,
    extraItems: [],
    orgCostResults: [],
    worksTotal,
    materialsTotal,
    sectionTotal: worksTotal + materialsTotal,
  };
}

// ─── Сборка сметы ─────────────────────────────────────────────────────────────

export function buildEstimate(
  sections: EstimateSection[],
  complexityCoeff: number,
  financialTerms: FinancialTerms = DEFAULT_FINANCIAL_TERMS,
  catalog: CatalogCategory[] = DEFAULT_CATALOG
): Estimate {
  const coeff = Math.min(Math.max(complexityCoeff, 1.0), 1.5);

  // First pass: compute standard sections to get the base for org_costs
  const standardBase = sections
    .filter((s) => s.sectionType === "standard")
    .reduce((sum, s) => {
      const lines = s.catalogItems
        .map((i) => buildEstimateLine(i, catalog))
        .filter((l): l is EstimateLine => l !== null);
      const linesTotal = Math.round(lines.reduce((a, l) => a + l.subtotal, 0) * coeff);
      const manualTotal = s.manualItems.reduce((a, m) => a + m.subtotal, 0);
      const matsTotal = calcMaterialSubtotal(s.materials);
      return sum + linesTotal + manualTotal + matsTotal;
    }, 0);

  // Second pass: build all section results
  const sectionResults: EstimateSectionResult[] = sections.map((s, i) =>
    buildSectionResult(s, i + 1, coeff, standardBase, catalog)
  );

  // Derive flat fields
  const allLines = sectionResults.flatMap((s) => s.lines);
  const allManual = sectionResults.flatMap((s) => s.manualItems);
  const allMaterials = sectionResults.flatMap((s) => s.materials);
  const allExtraCosts = sectionResults.flatMap((s) => s.extraItems);

  const worksSubtotal = allLines.reduce((s, l) => s + l.subtotal, 0);
  const linesWithCoeffTotal = Math.round(worksSubtotal * coeff);
  const manualWorksSubtotal = allManual.reduce((s, m) => s + m.subtotal, 0);
  const materialsSubtotal = calcMaterialSubtotal(allMaterials);
  const extraCostsTotal = calcExtraCostsTotal(allExtraCosts);
  const orgCostsTotal = sectionResults
    .filter((s) => s.sectionType === "org_costs")
    .reduce((s, r) => s + r.sectionTotal, 0);

  const worksTotal = linesWithCoeffTotal + manualWorksSubtotal;
  const baseTotal =
    worksTotal + materialsSubtotal + extraCostsTotal + orgCostsTotal;

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
    sections: sectionResults,
    lines: allLines,
    complexityCoeff: coeff,
    worksSubtotal,
    worksTotal,
    manualWorks: allManual,
    manualWorksSubtotal,
    materials: allMaterials,
    materialsSubtotal,
    extraCosts: allExtraCosts,
    extraCostsTotal,
    financialTerms,
    summary,
    subtotal: worksSubtotal,
    total: summary.finalTotal,
    createdAt: new Date().toISOString(),
  };
}

// ─── Вспомогательные ──────────────────────────────────────────────────────────

export function formatRub(amount: number): string {
  return amount.toLocaleString("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
