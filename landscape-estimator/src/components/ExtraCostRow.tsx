"use client";

import type { ExtraCost } from "@/types";

const DATALIST_ID = "extra-cost-suggestions";

interface Props {
  cost: ExtraCost;
  suggestions: string[];
  onChange: (updated: ExtraCost) => void;
  onRemove: () => void;
}

export default function ExtraCostRow({ cost, suggestions, onChange, onRemove }: Props) {
  return (
    <>
      <datalist id={DATALIST_ID}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <div className="flex flex-wrap gap-2 items-center p-3 bg-white rounded-lg border border-gray-200">
        {/* Название */}
        <input
          type="text"
          list={DATALIST_ID}
          placeholder="Наименование расхода"
          className="border border-gray-300 rounded px-2 py-1.5 text-sm flex-grow min-w-[160px]"
          value={cost.title}
          onChange={(e) => onChange({ ...cost, title: e.target.value })}
        />

        {/* Сумма */}
        <input
          type="number"
          min={0}
          placeholder="Сумма ₽"
          className="border border-gray-300 rounded px-2 py-1.5 text-sm w-32 text-right"
          value={cost.amount || ""}
          onChange={(e) => onChange({ ...cost, amount: parseFloat(e.target.value) || 0 })}
        />

        {/* Комментарий */}
        <input
          type="text"
          placeholder="Комментарий (необяз.)"
          className="border border-gray-300 rounded px-2 py-1.5 text-sm flex-grow min-w-[120px]"
          value={cost.comment ?? ""}
          onChange={(e) => onChange({ ...cost, comment: e.target.value })}
        />

        <button
          onClick={onRemove}
          className="ml-auto text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
          title="Удалить"
        >
          ×
        </button>
      </div>
    </>
  );
}
