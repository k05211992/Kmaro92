"use client";

import { useEffect, useReducer, useCallback, useState } from "react";
import Link from "next/link";
import WorkRow from "@/components/WorkRow";
import ManualLineRow from "@/components/ManualLineRow";
import MaterialRow from "@/components/MaterialRow";
import ExtraCostRow from "@/components/ExtraCostRow";
import FinancialTermsForm from "@/components/FinancialTermsForm";
import EstimateTable from "@/components/EstimateTable";
import HistoryPanel from "@/components/HistoryPanel";
import TemplatePanel from "@/components/TemplatePanel";
import {
  buildEstimate,
  formatRub,
  makeMaterial,
  makeExtraCost,
  makeManualLine,
  updateMaterialSubtotal,
} from "@/lib/calc";
import { getCatalog } from "@/lib/catalogStorage";
import {
  saveState,
  loadState,
  saveToHistory,
  loadHistory,
  deleteFromHistory,
  duplicateInHistory,
} from "@/lib/storage";
import { saveTemplate } from "@/lib/templateStorage";
import {
  DEFAULT_FINANCIAL_TERMS,
  type WorkInput,
  type ProjectMeta,
  type Estimate,
  type SavedEstimate,
  type MaterialLine,
  type ExtraCost,
  type ManualLine,
  type FinancialTerms,
  type Catalog,
  type EstimateTemplate,
} from "@/types";

const FALLBACK_CATEGORY = "lawn";

interface State {
  inputs: WorkInput[];
  complexityCoeff: number;
  meta: ProjectMeta;
  materials: MaterialLine[];
  extraCosts: ExtraCost[];
  manualWorks: ManualLine[];
  financialTerms: FinancialTerms;
}

type Action =
  | { type: "SET_INPUT"; index: number; value: WorkInput }
  | { type: "ADD_ROW"; category: string }
  | { type: "REMOVE_ROW"; index: number }
  | { type: "SET_COEFF"; value: number }
  | { type: "SET_META"; value: ProjectMeta }
  | { type: "ADD_MATERIAL" }
  | { type: "SET_MATERIAL"; index: number; value: MaterialLine }
  | { type: "REMOVE_MATERIAL"; index: number }
  | { type: "ADD_EXTRA_COST" }
  | { type: "SET_EXTRA_COST"; index: number; value: ExtraCost }
  | { type: "REMOVE_EXTRA_COST"; index: number }
  | { type: "ADD_MANUAL_WORK" }
  | { type: "SET_MANUAL_WORK"; index: number; value: ManualLine }
  | { type: "REMOVE_MANUAL_WORK"; index: number }
  | { type: "SET_FINANCIAL_TERMS"; value: FinancialTerms }
  | { type: "LOAD"; state: State };

const initialState: State = {
  inputs: [{ category: FALLBACK_CATEGORY, quantity: 0 }],
  complexityCoeff: 1.0,
  meta: { clientName: "", phone: "", address: "", note: "" },
  materials: [],
  extraCosts: [],
  manualWorks: [],
  financialTerms: DEFAULT_FINANCIAL_TERMS,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_ROW":
      return { ...state, inputs: [...state.inputs, { category: action.category, quantity: 0 }] };
    case "REMOVE_ROW":
      return { ...state, inputs: state.inputs.filter((_, i) => i !== action.index) };
    case "SET_INPUT": {
      const inputs = [...state.inputs];
      inputs[action.index] = action.value;
      return { ...state, inputs };
    }
    case "SET_COEFF":
      return { ...state, complexityCoeff: action.value };
    case "SET_META":
      return { ...state, meta: action.value };
    case "ADD_MATERIAL":
      return { ...state, materials: [...state.materials, makeMaterial()] };
    case "SET_MATERIAL": {
      const materials = [...state.materials];
      materials[action.index] = updateMaterialSubtotal(action.value);
      return { ...state, materials };
    }
    case "REMOVE_MATERIAL":
      return { ...state, materials: state.materials.filter((_, i) => i !== action.index) };
    case "ADD_EXTRA_COST":
      return { ...state, extraCosts: [...state.extraCosts, makeExtraCost()] };
    case "SET_EXTRA_COST": {
      const extraCosts = [...state.extraCosts];
      extraCosts[action.index] = action.value;
      return { ...state, extraCosts };
    }
    case "REMOVE_EXTRA_COST":
      return { ...state, extraCosts: state.extraCosts.filter((_, i) => i !== action.index) };
    case "ADD_MANUAL_WORK":
      return { ...state, manualWorks: [...state.manualWorks, makeManualLine()] };
    case "SET_MANUAL_WORK": {
      const manualWorks = [...state.manualWorks];
      manualWorks[action.index] = action.value;
      return { ...state, manualWorks };
    }
    case "REMOVE_MANUAL_WORK":
      return { ...state, manualWorks: state.manualWorks.filter((_, i) => i !== action.index) };
    case "SET_FINANCIAL_TERMS":
      return { ...state, financialTerms: action.value };
    case "LOAD":
      return action.state;
    default:
      return state;
  }
}

export default function HomePage() {
  const [catalog, setCatalog] = useState<Catalog>(() =>
    typeof window !== "undefined" ? getCatalog() : { works: [], materials: [], coefficients: [], extraCostPresets: [] }
  );
  const [state, dispatch] = useReducer(reducer, initialState);
  const [history, setHistory] = useState<SavedEstimate[]>([]);
  const [openPanel, setOpenPanel] = useState<"history" | "templates" | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const complexityCoeff = catalog.coefficients.find((c) => c.id === "complexity");
  const coeffMin = complexityCoeff?.min ?? 1.0;
  const coeffMax = complexityCoeff?.max ?? 1.5;
  const extraSuggestions = catalog.extraCostPresets
    .filter((p) => p.active !== false)
    .map((p) => p.title);
  const defaultCategory =
    catalog.works.find((w) => w.active !== false)?.id ?? FALLBACK_CATEGORY;

  const estimate: Estimate = buildEstimate(
    state.inputs,
    state.complexityCoeff,
    state.materials,
    state.extraCosts,
    state.manualWorks,
    state.financialTerms,
    catalog.works
  );

  // Загрузка черновика и истории
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      dispatch({
        type: "LOAD",
        state: {
          inputs: saved.inputs,
          complexityCoeff: saved.complexityCoeff,
          meta: saved.meta,
          materials: saved.materials ?? [],
          extraCosts: saved.extraCosts ?? [],
          manualWorks: saved.manualWorks ?? [],
          financialTerms: saved.financialTerms ?? DEFAULT_FINANCIAL_TERMS,
        },
      });
    }
    setHistory(loadHistory());
  }, []);

  // Обновление каталога при возврате из вкладки настроек
  useEffect(() => {
    const refresh = () => setCatalog(getCatalog());
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  // Автосохранение черновика
  useEffect(() => {
    saveState({ ...state, estimate });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const handlePrint = useCallback(() => {
    sessionStorage.setItem("print_estimate", JSON.stringify({ estimate, meta: state.meta }));
    window.open("/print", "_blank");
  }, [estimate, state.meta]);

  const handleSaveToHistory = useCallback(() => {
    if (estimate.summary.baseTotal === 0) return;
    saveToHistory(
      state.inputs,
      state.complexityCoeff,
      state.meta,
      estimate.total,
      state.materials,
      state.extraCosts,
      state.manualWorks,
      state.financialTerms
    );
    setHistory(loadHistory());
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }, [state, estimate]);

  const handleOpen = useCallback((entry: SavedEstimate) => {
    dispatch({
      type: "LOAD",
      state: {
        inputs: entry.inputs,
        complexityCoeff: entry.complexityCoeff,
        meta: entry.meta,
        materials: entry.materials ?? [],
        extraCosts: entry.extraCosts ?? [],
        manualWorks: entry.manualWorks ?? [],
        financialTerms: entry.financialTerms ?? DEFAULT_FINANCIAL_TERMS,
      },
    });
    setOpenPanel(null);
  }, []);

  const handleApplyTemplate = useCallback((tmpl: EstimateTemplate) => {
    dispatch({
      type: "LOAD",
      state: {
        inputs: tmpl.inputs,
        complexityCoeff: tmpl.complexityCoeff ?? 1.0,
        meta: { clientName: "", phone: "", address: "", note: "" },
        materials: tmpl.materials ?? [],
        extraCosts: tmpl.extraCosts ?? [],
        manualWorks: tmpl.manualWorks ?? [],
        financialTerms: DEFAULT_FINANCIAL_TERMS,
      },
    });
    setOpenPanel(null);
  }, []);

  const handleSaveAsTemplate = useCallback((name: string, description: string) => {
    const tmpl: EstimateTemplate = {
      id: crypto.randomUUID(),
      name,
      description: description || undefined,
      inputs: state.inputs,
      complexityCoeff: state.complexityCoeff,
      materials: state.materials.length > 0 ? state.materials : undefined,
      extraCosts: state.extraCosts.length > 0 ? state.extraCosts : undefined,
      manualWorks: state.manualWorks.length > 0 ? state.manualWorks : undefined,
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
    };
    saveTemplate(tmpl);
  }, [state]);

  const handleDuplicate = useCallback((id: string) => setHistory(duplicateInHistory(id)), []);
  const handleDelete = useCallback((id: string) => setHistory(deleteFromHistory(id)), []);

  const { summary } = estimate;
  const hasContent = summary.baseTotal > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Генератор смет — Ландшафтные работы
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Составьте смету и распечатайте её для клиента
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/catalog"
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Каталог
            </Link>
            <button
              onClick={() => setOpenPanel((v) => (v === "templates" ? null : "templates"))}
              className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm transition-colors ${openPanel === "templates" ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
            >
              Шаблоны
            </button>
            <button
              onClick={() => setOpenPanel((v) => (v === "history" ? null : "history"))}
              className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm transition-colors ${openPanel === "history" ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
            >
              История
              {history.length > 0 && (
                <span className="bg-gray-200 text-gray-700 rounded-full text-xs px-1.5 py-0.5 leading-none">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {openPanel && (
          <aside className="w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-800">
                  {openPanel === "history" ? "История смет" : "Шаблоны смет"}
                </h2>
                <button onClick={() => setOpenPanel(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
              </div>
              {openPanel === "history" ? (
                <HistoryPanel history={history} onOpen={handleOpen} onDuplicate={handleDuplicate} onDelete={handleDelete} />
              ) : (
                <TemplatePanel onApply={handleApplyTemplate} onSaveAsTemplate={handleSaveAsTemplate} />
              )}
            </div>
          </aside>
        )}

        <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
          {/* ─── Левая колонка ────────────────────────────────── */}
          <div className="space-y-4">
            {/* Данные проекта */}
            <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <h2 className="font-semibold text-gray-800">Данные проекта</h2>
              <input type="text" placeholder="Имя клиента"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={state.meta.clientName}
                onChange={(e) => dispatch({ type: "SET_META", value: { ...state.meta, clientName: e.target.value } })}
              />
              <input type="tel" placeholder="Телефон клиента (необязательно)"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={state.meta.phone ?? ""}
                onChange={(e) => dispatch({ type: "SET_META", value: { ...state.meta, phone: e.target.value } })}
              />
              <input type="text" placeholder="Адрес объекта"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={state.meta.address}
                onChange={(e) => dispatch({ type: "SET_META", value: { ...state.meta, address: e.target.value } })}
              />
              <textarea placeholder="Примечание (необязательно)" rows={2}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none"
                value={state.meta.note}
                onChange={(e) => dispatch({ type: "SET_META", value: { ...state.meta, note: e.target.value } })}
              />
            </section>

            {/* Работы */}
            <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <h2 className="font-semibold text-gray-800">Работы</h2>
              {state.inputs.map((input, i) => (
                <WorkRow key={i} input={input} categories={catalog.works}
                  onChange={(v) => dispatch({ type: "SET_INPUT", index: i, value: v })}
                  onRemove={() => dispatch({ type: "REMOVE_ROW", index: i })}
                />
              ))}
              {state.manualWorks.map((line, i) => (
                <ManualLineRow key={line.id} line={line} titlePlaceholder="Наименование работы"
                  onChange={(v) => dispatch({ type: "SET_MANUAL_WORK", index: i, value: v })}
                  onRemove={() => dispatch({ type: "REMOVE_MANUAL_WORK", index: i })}
                />
              ))}
              <div className="flex gap-2">
                <button onClick={() => dispatch({ type: "ADD_ROW", category: defaultCategory })}
                  className="flex-1 border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors">
                  + Из каталога
                </button>
                <button onClick={() => dispatch({ type: "ADD_MANUAL_WORK" })}
                  className="flex-1 border-2 border-dashed border-amber-300 rounded-lg py-2 text-sm text-amber-600 hover:border-amber-400 hover:text-amber-700 transition-colors">
                  + Ручная строка
                </button>
              </div>
            </section>

            {/* Материалы */}
            <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <h2 className="font-semibold text-gray-800">Материалы</h2>
              {state.materials.length === 0 && (
                <p className="text-sm text-gray-400">Начните вводить название — появятся подсказки с ценами</p>
              )}
              {state.materials.map((m, i) => (
                <MaterialRow key={m.id} material={m} presets={catalog.materials}
                  onChange={(v) => dispatch({ type: "SET_MATERIAL", index: i, value: v })}
                  onRemove={() => dispatch({ type: "REMOVE_MATERIAL", index: i })}
                />
              ))}
              <button onClick={() => dispatch({ type: "ADD_MATERIAL" })}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                + Добавить материал
              </button>
            </section>

            {/* Доп. расходы */}
            <section className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <h2 className="font-semibold text-gray-800">Дополнительные расходы</h2>
              {state.extraCosts.length === 0 && (
                <p className="text-sm text-gray-400">Доставка, вывоз мусора, аренда техники и другие расходы</p>
              )}
              {state.extraCosts.map((cost, i) => (
                <ExtraCostRow key={cost.id} cost={cost} suggestions={extraSuggestions}
                  onChange={(v) => dispatch({ type: "SET_EXTRA_COST", index: i, value: v })}
                  onRemove={() => dispatch({ type: "REMOVE_EXTRA_COST", index: i })}
                />
              ))}
              <button onClick={() => dispatch({ type: "ADD_EXTRA_COST" })}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-orange-400 hover:text-orange-600 transition-colors">
                + Добавить расход
              </button>
            </section>

            {/* Коэффициент сложности */}
            <section className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="font-semibold text-gray-800">Коэффициент сложности</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Применяется только к работам</p>
                </div>
                <span className="text-sm font-medium text-gray-700">×{state.complexityCoeff.toFixed(2)}</span>
              </div>
              <input type="range" min={coeffMin} max={coeffMax} step={0.05}
                value={state.complexityCoeff}
                onChange={(e) => dispatch({ type: "SET_COEFF", value: parseFloat(e.target.value) })}
                className="w-full accent-green-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{coeffMin} — стандарт</span>
                <span>{coeffMax} — сложный объект</span>
              </div>
            </section>

            {/* Финансовые условия */}
            <section className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-800 mb-3">Финансовые условия</h2>
              <FinancialTermsForm
                terms={state.financialTerms}
                onChange={(v) => dispatch({ type: "SET_FINANCIAL_TERMS", value: v })}
              />
            </section>
          </div>

          {/* ─── Правая колонка ───────────────────────────────── */}
          <div className="space-y-4">
            <section className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">Смета</h2>
                {hasContent && (
                  <div className="flex gap-2">
                    <button onClick={handleSaveToHistory}
                      className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${savedFlash ? "bg-green-50 border-green-300 text-green-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
                      {savedFlash ? "Сохранено ✓" : "Сохранить"}
                    </button>
                    <button onClick={handlePrint}
                      className="bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors">
                      Распечатать
                    </button>
                  </div>
                )}
              </div>
              <EstimateTable estimate={estimate} />
            </section>

            {hasContent && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="text-center">
                  <div className="text-sm text-green-700">Итого к оплате</div>
                  <div className="text-3xl font-bold text-green-800 mt-1">{formatRub(summary.finalTotal)}</div>
                </div>
                {(summary.markupAmount > 0 || summary.discountAmount > 0 || summary.prepaymentAmount > 0 || summary.minimumApplied) && (
                  <div className="mt-3 pt-3 border-t border-green-200 space-y-1">
                    <div className="flex justify-between text-xs text-green-700"><span>Базовый итог</span><span>{formatRub(summary.baseTotal)}</span></div>
                    {summary.markupAmount > 0 && <div className="flex justify-between text-xs text-orange-600"><span>+ Наценка</span><span>+{formatRub(summary.markupAmount)}</span></div>}
                    {summary.discountAmount > 0 && <div className="flex justify-between text-xs text-red-600"><span>− Скидка</span><span>−{formatRub(summary.discountAmount)}</span></div>}
                    {summary.minimumApplied && <div className="flex justify-between text-xs text-blue-600"><span>Мин. заказ</span><span>{formatRub(summary.finalTotal)}</span></div>}
                    {summary.prepaymentAmount > 0 && (<>
                      <div className="border-t border-green-200 my-1" />
                      <div className="flex justify-between text-xs text-blue-700"><span>Предоплата ({state.financialTerms.prepaymentPercent}%)</span><span>{formatRub(summary.prepaymentAmount)}</span></div>
                      <div className="flex justify-between text-xs text-gray-600"><span>Остаток</span><span>{formatRub(summary.remainingAmount)}</span></div>
                    </>)}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
