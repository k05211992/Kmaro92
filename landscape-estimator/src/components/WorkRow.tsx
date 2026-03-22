"use client";

import type { WorkInput, CatalogCategory } from "@/types";

interface Props {
  input: WorkInput;
  categories: CatalogCategory[];
  onChange: (updated: WorkInput) => void;
  onRemove: () => void;
  isZero?: boolean;
}

export default function WorkRow({ input, categories, onChange, onRemove, isZero }: Props) {
  const activeCategories = categories.filter((c) => c.active !== false);
  const cat = activeCategories.find((c) => c.id === input.category) ?? activeCategories[0];
  const activeVariants = cat?.variants.filter((v) => v.active !== false) ?? [];

  return (
    <div className={`flex flex-wrap gap-2 items-center p-3 bg-white rounded-lg border transition-colors ${isZero ? "border-amber-400 bg-amber-50" : "border-gray-200"}`}>
      {/* Категория */}
      <select
        className="border border-gray-300 rounded px-2 py-1.5 text-sm flex-shrink-0"
        value={input.category}
        onChange={(e) =>
          onChange({ category: e.target.value, quantity: input.quantity, variant: undefined })
        }
      >
        {activeCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>

      {/* Вариант */}
      {cat && (
        <select
          className="border border-gray-300 rounded px-2 py-1.5 text-sm flex-grow min-w-[180px]"
          value={input.variant ?? activeVariants[0]?.id ?? ""}
          onChange={(e) => onChange({ ...input, variant: e.target.value })}
        >
          {activeVariants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label} — {v.unitPrice.toLocaleString("ru-RU")} ₽/{cat.unit}
            </option>
          ))}
        </select>
      )}

      {/* Количество */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm w-24 text-right"
          value={input.quantity || ""}
          placeholder="0"
          onChange={(e) =>
            onChange({ ...input, quantity: parseFloat(e.target.value) || 0 })
          }
        />
        <span className="text-sm text-gray-500 w-12">{cat?.unit}</span>
      </div>

      <button
        onClick={onRemove}
        className="ml-auto text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
        title="Удалить строку"
      >
        ×
      </button>
    </div>
  );
}
