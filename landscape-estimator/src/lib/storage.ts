import type {
  Estimate,
  EstimateSection,
  ExtraCost,
  FinancialTerms,
  ManualLine,
  MaterialLine,
  ProjectMeta,
  SavedEstimate,
  WorkInput,
} from "@/types";
import { DEFAULT_FINANCIAL_TERMS } from "@/types";
import { makeSection } from "@/lib/calc";

const DRAFT_KEY = "landscape_estimator_draft";
const HISTORY_KEY = "landscape_estimator_history";
const MAX_HISTORY = 50;

// ─── Черновик ────────────────────────────────────────────────────────────────

export interface DraftState {
  sections: EstimateSection[];
  complexityCoeff: number;
  meta: ProjectMeta;
  financialTerms: FinancialTerms;
  estimate: Estimate;
}

export function saveState(state: DraftState): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

// ─── Миграция старого формата ─────────────────────────────────────────────────

interface LegacyDraftState {
  inputs?: WorkInput[];
  complexityCoeff?: number;
  meta?: ProjectMeta;
  materials?: MaterialLine[];
  extraCosts?: ExtraCost[];
  manualWorks?: ManualLine[];
  financialTerms?: FinancialTerms;
  estimate?: Estimate;
  // new format
  sections?: EstimateSection[];
}

export function migrateToSections(legacy: LegacyDraftState): EstimateSection[] {
  if (legacy.sections && legacy.sections.length > 0) {
    return legacy.sections;
  }

  const sections: EstimateSection[] = [];

  // Main works section from flat inputs
  const mainSection = makeSection({
    sectionName: "Основные работы",
    sectionType: "standard",
    catalogItems: legacy.inputs ?? [],
    manualItems: legacy.manualWorks ?? [],
    materials: legacy.materials ?? [],
  });
  sections.push(mainSection);

  // Extra costs section
  if (legacy.extraCosts && legacy.extraCosts.length > 0) {
    sections.push(
      makeSection({
        sectionName: "Доп. расходы",
        sectionType: "extra_costs",
        extraItems: legacy.extraCosts,
      })
    );
  }

  return sections;
}

export function loadState(): DraftState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as LegacyDraftState;

    // Already new format
    if (parsed.sections && !parsed.inputs) {
      return parsed as DraftState;
    }

    // Migrate old format
    const sections = migrateToSections(parsed);
    return {
      sections,
      complexityCoeff: parsed.complexityCoeff ?? 1.0,
      meta: parsed.meta ?? { clientName: "", address: "", note: "" },
      financialTerms: parsed.financialTerms ?? DEFAULT_FINANCIAL_TERMS,
      estimate: parsed.estimate as Estimate,
    };
  } catch {
    return null;
  }
}

// ─── История ─────────────────────────────────────────────────────────────────

export function loadHistory(): SavedEstimate[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as SavedEstimate[]) : [];
  } catch {
    return [];
  }
}

function persistHistory(history: SavedEstimate[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore quota errors
  }
}

export function saveToHistory(
  sections: EstimateSection[],
  complexityCoeff: number,
  meta: ProjectMeta,
  total: number,
  financialTerms: FinancialTerms = DEFAULT_FINANCIAL_TERMS
): SavedEstimate {
  const entry: SavedEstimate = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    meta,
    sections,
    complexityCoeff,
    financialTerms,
    total,
    // backward compat flat fields (derived from sections)
    inputs: sections.flatMap((s) => s.catalogItems),
    materials: sections.flatMap((s) => s.materials),
    extraCosts: sections.flatMap((s) => s.extraItems),
    manualWorks: sections.flatMap((s) => s.manualItems),
  };
  const history = [entry, ...loadHistory()].slice(0, MAX_HISTORY);
  persistHistory(history);
  return entry;
}

export function migrateHistoryEntry(saved: SavedEstimate): EstimateSection[] {
  return migrateToSections({
    sections: saved.sections,
    inputs: saved.inputs,
    materials: saved.materials,
    extraCosts: saved.extraCosts,
    manualWorks: saved.manualWorks,
  });
}

export function deleteFromHistory(id: string): SavedEstimate[] {
  const history = loadHistory().filter((e) => e.id !== id);
  persistHistory(history);
  return history;
}

export function duplicateInHistory(id: string): SavedEstimate[] {
  const history = loadHistory();
  const original = history.find((e) => e.id === id);
  if (!original) return history;
  const copy: SavedEstimate = {
    ...original,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    meta: {
      ...original.meta,
      clientName: original.meta.clientName
        ? `${original.meta.clientName} (копия)`
        : "",
    },
  };
  const updated = [copy, ...history].slice(0, MAX_HISTORY);
  persistHistory(updated);
  return updated;
}
