"use client";

import { updateMaterialSubtotal } from "@/lib/calc";
import { formatRub } from "@/lib/calc";
import UnitSelect from "@/components/UnitSelect";
import type { MaterialLine, CatalogMaterial } from "@/types";

const DATALIST_ID = "material-presets";

interface Props {
  material: MaterialLine;
  presets: CatalogMaterial[];
  onChange: (updated: MaterialLine) => void;
  onRemove: () => void;
}

export default function MaterialRow({ material, presets, onChange, onRemove }: Props) {
  const activePresets = presets.filter((p) => p.active !== false);

  function update(patch: Partial<MaterialLine>) {
    onChange(updateMaterialSubtotal({ ...material, ...patch }));
  }

  function handleTitleChange(title: string) {
    const preset = activePresets.find((p) => p.title === title);
    if (preset) {
      update({ title, unit: preset.unit, price: preset.defaultPrice });
    } else {
      update({ title });
    }
  }

  return (
    <>
      <datalist id={DATALIST_ID}>
        {activePresets.map((p) => (
          <option key={p.id} value={p.title} />
        ))}
      </datalist>

      <div className="flex flex-wrap gap-2 items-start p-3 bg-white rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-2 items-center w-full">
          {/* Название */}
          <input
            type="text"
            list={DATALIST_ID}
            placeholder="Материал"
            className="border border-gray-300 rounded px-2 py-1.5 text-sm flex-grow min-w-[160px]"
            value={material.title}
            onChange={(e) => handleTitleChange(e.target.value)}
          />

          {/* Единица */}
          <UnitSelect
            value={material.unit}
            onChange={(v) => update({ unit: v })}
          />

          {/* Количество */}
          <input
            type="number"
            min={0}
            placeholder="Кол-во"
            className="border border-gray-300 rounded px-2 py-1.5 text-sm w-24 text-right"
            value={material.quantity || ""}
            onChange={(e) => update({ quantity: parseFloat(e.target.value) || 0 })}
          />

          {/* Цена */}
          <input
            type="number"
            min={0}
            placeholder="Цена ₽"
            className="border border-gray-300 rounded px-2 py-1.5 text-sm w-28 text-right"
            value={material.price || ""}
            onChange={(e) => update({ price: parseFloat(e.target.value) || 0 })}
          />

          {/* Сумма */}
          <span className="text-sm font-medium text-gray-700 w-24 text-right tabular-nums">
            {material.subtotal > 0 ? formatRub(material.subtotal) : "—"}
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
          className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-gray-500"
          value={material.comment ?? ""}
          onChange={(e) => update({ comment: e.target.value })}
        />
      </div>
    </>
  );
}
