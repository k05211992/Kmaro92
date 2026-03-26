"use client";

import { useEffect, useReducer, useCallback, useState, useRef } from "react";
import Link from "next/link";
import SectionPanel from "@/components/SectionPanel";
import FinancialTermsForm from "@/components/FinancialTermsForm";
import EstimateTable from "@/components/EstimateTable";
import HistoryPanel from "@/components/HistoryPanel";
import TemplatePanel from "@/components/TemplatePanel";
import {
  buildEstimate,
  formatRub,
  makeSection,
} from "@/lib/calc";
import { getCatalog, getDefaultCatalog } from "@/lib/catalogStorage";
import {
  saveState,
  loadState,
  saveToHistory,
  loadHistory,
  deleteFromHistory,
  duplicateInHistory,
  migrateHistoryEntry,
} from "@/lib/storage";
import { saveTemplate } from "@/lib/templateStorage";
import {
  DEFAULT_FINANCIAL_TERMS,
  type ProjectMeta,
  type Estimate,
  type SavedEstimate,
  type FinancialTerms,
  type Catalog,
  type EstimateTemplate,
  type EstimateSection,
  type SectionType,
} from "@/types";

// ─── State ───────────────────────────────────────────────────────────────────

interface State {
  sections: EstimateSection[];
  complexityCoeff: number;
  meta: ProjectMeta;
  financialTerms: FinancialTerms;
}

type Action =
  | { type: "SET_SECTION"; id: string; value: EstimateSection }
  | { type: "ADD_SECTION"; sectionType: SectionType }
  | { type: "REMOVE_SECTION"; id: string }
  | { type: "SET_COEFF"; value: number }
  | { type: "SET_META"; value: ProjectMeta }
  | { type: "SET_FINANCIAL_TERMS"; value: FinancialTerms }
  | { type: "LOAD"; state: State };

function makeInitialSections(): EstimateSection[] {
  return [
    makeSection({ sectionName: "Основные работы", sectionType: "standard" }),
  ];
}

const initialState: State = {
  sections: makeInitialSections(),
  complexityCoeff: 1.0,
  meta: { clientName: "", phone: "", address: "", note: "" },
  financialTerms: DEFAULT_FINANCIAL_TERMS,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_SECTION":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.id ? action.value : s
        ),
      };
    case "ADD_SECTION":
      return {
        ...state,
        sections: [
          ...state.sections,
          makeSection({ sectionType: action.sectionType, sectionName: "" }),
        ],
      };
    case "REMOVE_SECTION":
      return {
        ...state,
        sections: state.sections.filter((s) => s.id !== action.id),
      };
    case "SET_COEFF":
      return { ...state, complexityCoeff: action.value };
    case "SET_META":
      return { ...state, meta: action.value };
    case "SET_FINANCIAL_TERMS":
      return { ...state, financialTerms: action.value };
    case "LOAD":
      return action.state;
    default:
      return state;
  }
}

// ─── Zero-price helpers ───────────────────────────────────────────────────────

interface ZeroWarning {
  label: string;
  detail: string;
}

function getZeroWarnings(estimate: Estimate): ZeroWarning[] {
  const warnings: ZeroWarning[] = [];

  for (const line of estimate.lines) {
    if (line.quantity > 0 && line.unitPrice === 0) {
      warnings.push({ label: line.variantLabel, detail: "цена 0 ₽/ед." });
    }
  }
  for (const m of estimate.manualWorks) {
    if (m.title.trim() && m.subtotal === 0) {
      warnings.push({ label: m.title, detail: m.price === 0 ? "цена 0 ₽" : "количество 0" });
    }
  }
  for (const m of estimate.materials) {
    if (m.title.trim() && m.subtotal === 0) {
      warnings.push({ label: m.title, detail: m.price === 0 ? "цена 0 ₽" : "количество 0" });
    }
  }
  for (const e of estimate.extraCosts) {
    if (e.title.trim() && e.amount === 0) {
      warnings.push({ label: e.title, detail: "сумма 0 ₽" });
    }
  }

  return warnings;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [catalog, setCatalog] = useState<Catalog>(getDefaultCatalog);
  const [state, dispatch] = useReducer(reducer, initialState);
  // Флаг: автосохранение не должно запускаться до первой загрузки черновика
  const autosaveReady = useRef(false);
  const [history, setHistory] = useState<SavedEstimate[]>([]);
  const [openPanel, setOpenPanel] = useState<"history" | "templates" | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [printPending, setPrintPending] = useState(false);
  const [savePending, setSavePending] = useState(false);

  const complexityConfig = catalog.coefficients.find((c) => c.id === "complexity");
  const coeffMin = complexityConfig?.min ?? 1.0;
  const coeffMax = complexityConfig?.max ?? 1.5;
  const extraSuggestions = catalog.extraCostPresets
    .filter((p) => p.active !== false)
    .map((p) => p.title);

  const estimate: Estimate = buildEstimate(
    state.sections,
    state.complexityCoeff,
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
          sections: saved.sections,
          complexityCoeff: saved.complexityCoeff,
          meta: saved.meta,
          financialTerms: saved.financialTerms ?? DEFAULT_FINANCIAL_TERMS,
        },
      });
    }
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    setCatalog(getCatalog());
  }, []);

  useEffect(() => {
    const refresh = () => setCatalog(getCatalog());
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  // Автосохранение черновика.
  // Пропускаем ПЕРВЫЙ запуск (при монтировании), чтобы не затереть черновик
  // из localStorage до того, как loadState() успеет его загрузить.
  useEffect(() => {
    if (!autosaveReady.current) {
      autosaveReady.current = true;
      return;
    }
    saveState({ ...state, estimate });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const doPrint = useCallback(() => {
    sessionStorage.setItem("print_estimate", JSON.stringify({ estimate, meta: state.meta }));
    window.open("/print", "_blank");
  }, [estimate, state.meta]);

  const handlePrint = useCallback(() => {
    const warnings = getZeroWarnings(estimate);
    if (warnings.length > 0) {
      setPrintPending(true);
    } else {
      doPrint();
    }
  }, [estimate, doPrint]);

  const doSave = useCallback(() => {
    saveToHistory(
      state.sections,
      state.complexityCoeff,
      state.meta,
      estimate.total,
      state.financialTerms
    );
    setHistory(loadHistory());
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }, [state, estimate]);

  const handleSaveToHistory = useCallback(() => {
    if (estimate.summary.baseTotal === 0) return;
    const warnings = getZeroWarnings(estimate);
    if (warnings.length > 0) {
      setSavePending(true);
    } else {
      doSave();
    }
  }, [estimate, doSave]);

  const handleOpen = useCallback((entry: SavedEstimate) => {
    const sections = migrateHistoryEntry(entry);
    dispatch({
      type: "LOAD",
      state: {
        sections,
        complexityCoeff: entry.complexityCoeff,
        meta: entry.meta,
        financialTerms: entry.financialTerms ?? DEFAULT_FINANCIAL_TERMS,
      },
    });
    setOpenPanel(null);
  }, []);

  const handleApplyTemplate = useCallback((tmpl: EstimateTemplate) => {
    // Migrate template to sections if needed
    const sections: EstimateSection[] = tmpl.sections && tmpl.sections.length > 0
      ? tmpl.sections
      : [
          makeSection({
            sectionName: "Основные работы",
            sectionType: "standard",
            catalogItems: tmpl.inputs,
            manualItems: tmpl.manualWorks ?? [],
            materials: tmpl.materials ?? [],
          }),
          ...(tmpl.extraCosts && tmpl.extraCosts.length > 0
            ? [makeSection({ sectionName: "Доп. расходы", sectionType: "extra_costs", extraItems: tmpl.extraCosts })]
            : []),
        ];

    dispatch({
      type: "LOAD",
      state: {
        sections,
        complexityCoeff: tmpl.complexityCoeff ?? 1.0,
        meta: { clientName: "", phone: "", address: "", note: "" },
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
      sections: state.sections,
      complexityCoeff: state.complexityCoeff,
      // backward compat flat fields
      inputs: state.sections.flatMap((s) => s.catalogItems),
      manualWorks: state.sections.flatMap((s) => s.manualItems),
      materials: state.sections.flatMap((s) => s.materials),
      extraCosts: state.sections.flatMap((s) => s.extraItems),
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
    };
    saveTemplate(tmpl);
  }, [state]);

  const handleDuplicate = useCallback((id: string) => setHistory(duplicateInHistory(id)), []);
  const handleDelete = useCallback((id: string) => setHistory(deleteFromHistory(id)), []);

  const { summary } = estimate;
  const hasContent = summary.baseTotal > 0;
  const zeroWarnings = getZeroWarnings(estimate);
  const hasZeroWarnings = zeroWarnings.length > 0;

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

            {/* Разделы */}
            {state.sections.map((section) => (
              <SectionPanel
                key={section.id}
                section={section}
                catalog={catalog}
                extraSuggestions={extraSuggestions}
                onChange={(updated) => dispatch({ type: "SET_SECTION", id: section.id, value: updated })}
                onRemove={() => dispatch({ type: "REMOVE_SECTION", id: section.id })}
                canRemove={state.sections.length > 1}
              />
            ))}

            {/* Добавить раздел */}
            <div className="flex gap-2">
              <button
                onClick={() => dispatch({ type: "ADD_SECTION", sectionType: "standard" })}
                className="flex-1 border-2 border-dashed border-gray-300 rounded-lg py-2.5 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Раздел работ
              </button>
              <button
                onClick={() => dispatch({ type: "ADD_SECTION", sectionType: "extra_costs" })}
                className="flex-1 border-2 border-dashed border-orange-200 rounded-lg py-2.5 text-sm text-orange-500 hover:border-orange-400 hover:text-orange-600 transition-colors"
              >
                + Доп. расходы
              </button>
              <button
                onClick={() => dispatch({ type: "ADD_SECTION", sectionType: "org_costs" })}
                className="flex-1 border-2 border-dashed border-purple-200 rounded-lg py-2.5 text-sm text-purple-500 hover:border-purple-400 hover:text-purple-600 transition-colors"
              >
                + Орг. затраты
              </button>
            </div>

            {/* Коэффициент сложности */}
            <section className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="font-semibold text-gray-800">Коэффициент сложности</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Применяется только к работам из каталога</p>
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

              {/* Zero-price warning banner */}
              {hasContent && hasZeroWarnings && (
                <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-800 mb-1.5">
                    ⚠ Строки с нулевой суммой — проверьте перед печатью
                  </p>
                  <ul className="space-y-0.5">
                    {zeroWarnings.map((w, i) => (
                      <li key={i} className="text-xs text-amber-700">
                        <span className="font-medium">{w.label}</span>
                        {" — "}{w.detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Confirm dialog: print */}
              {printPending && (
                <div className="mb-4 rounded-lg border border-amber-400 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-800 mb-2">
                    В смете есть строки с 0 ₽. Всё равно распечатать?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setPrintPending(false); doPrint(); }}
                      className="text-xs px-3 py-1.5 rounded bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                    >
                      Да, печатать
                    </button>
                    <button
                      onClick={() => setPrintPending(false)}
                      className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm dialog: save */}
              {savePending && (
                <div className="mb-4 rounded-lg border border-amber-400 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-800 mb-2">
                    В смете есть строки с 0 ₽. Всё равно сохранить в историю?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSavePending(false); doSave(); }}
                      className="text-xs px-3 py-1.5 rounded bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                    >
                      Да, сохранить
                    </button>
                    <button
                      onClick={() => setSavePending(false)}
                      className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}

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
