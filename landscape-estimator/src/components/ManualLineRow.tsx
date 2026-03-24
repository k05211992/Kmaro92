"use client";

import { updateManualLineSubtotal, formatRub } from "@/lib/calc";
import UnitSelect from "@/components/UnitSelect";
import type { ManualLine } from "@/types";

interface Props {
  line: ManualLine;
  onChange: (updated: ManualLine) => void;
  onRemove: () => void;
  titlePlaceholder?: string;
  isZero?: boolean;
}

export default function ManualLineRow({
  line,
  onChange,
  onRemove,
  titlePlaceholder = "Наименование",
  isZero,
}: Props) {
  function update(patch: Partial<Omit<ManualLine, "isManual">>) {
    onChange(updateManualLineSubtotal({ ...line, ...patch }));
  }

  return (
    <div className={`flex flex-wrap gap-2 items-start p-3 rounded-lg border transition-colors ${isZero ? "bg-red-50 border-red-300" : "bg-amber-50 border-amber-200"}`}>
      <div className="flex flex-wrap gap-2 items-center w-full">
        {/* Название */}
        <input
          type="text"
          placeholder={titlePlaceholder}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm flex-grow min-w-[160px] bg-white"
          value={line.title}
          onChange={(e) => update({ title: e.target.value })}
        />

        {/* Единица */}
        <UnitSelect
          value={line.unit ?? ""}
          onChange={(v) => update({ unit: v })}
        />

        {/* Количество */}
        <input
          type="number"
          min={0}
          placeholder="Кол-во"
          className="border border-gray-300 rounded px-2 py-1.5 text-sm w-24 text-right bg-white"
          value={line.quantity || ""}
          onChange={(e) => update({ quantity: parseFloat(e.target.value) || 0 })}
        />

        {/* Цена */}
        <input
          type="number"
          min={0}
          placeholder="Цена ₽"
          className="border border-gray-300 rounded px-2 py-1.5 text-sm w-28 text-right bg-white"
          value={line.price || ""}
          onChange={(e) => update({ price: parseFloat(e.target.value) || 0 })}
        />

        {/* Сумма */}
        <span className="text-sm font-medium text-gray-700 w-24 text-right tabular-nums">
          {line.subtotal > 0 ? formatRub(line.subtotal) : "—"}
        </span>

        <button
          onClick={onRemove}
          className="ml-auto text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
          title="Удалить"
        >
          ×
        </button>
      </div>

      {/* Комментарий */}
      <input
        type="text"
        placeholder="Комментарий (необязательно)"
        className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-gray-500 bg-white"
        value={line.comment ?? ""}
        onChange={(e) => update({ comment: e.target.value })}
      />
    </div>
  );
}
