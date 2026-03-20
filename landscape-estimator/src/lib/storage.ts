import type {
  Estimate,
  ExtraCost,
  FinancialTerms,
  ManualLine,
  MaterialLine,
  ProjectMeta,
  SavedEstimate,
  WorkInput,
} from "@/types";
import { DEFAULT_FINANCIAL_TERMS } from "@/types";

const DRAFT_KEY = "landscape_estimator_draft";
const HISTORY_KEY = "landscape_estimator_history";
const MAX_HISTORY = 50;

// ─── Черновик ────────────────────────────────────────────────────────────────

interface DraftState {
  inputs: WorkInput[];
  complexityCoeff: number;
  meta: ProjectMeta;
  materials: MaterialLine[];
  extraCosts: ExtraCost[];
  manualWorks: ManualLine[];
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

export function loadState(): DraftState | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as DraftState) : null;
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
  inputs: WorkInput[],
  complexityCoeff: number,
  meta: ProjectMeta,
  total: number,
  materials: MaterialLine[] = [],
  extraCosts: ExtraCost[] = [],
  manualWorks: ManualLine[] = [],
  financialTerms: FinancialTerms = DEFAULT_FINANCIAL_TERMS
): SavedEstimate {
  const entry: SavedEstimate = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    meta,
    inputs,
    complexityCoeff,
    materials,
    extraCosts,
    manualWorks,
    financialTerms,
    total,
  };
  const history = [entry, ...loadHistory()].slice(0, MAX_HISTORY);
  persistHistory(history);
  return entry;
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
