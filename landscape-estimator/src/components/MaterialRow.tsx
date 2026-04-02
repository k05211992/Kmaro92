"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { updateMaterialSubtotal, formatRub } from "@/lib/calc";
import UnitSelect from "@/components/UnitSelect";
import type { MaterialLine, CatalogMaterial } from "@/types";

interface Props {
  material: MaterialLine;
  presets: CatalogMaterial[];
  onChange: (updated: MaterialLine) => void;
  onRemove: () => void;
  isZero?: boolean;
}

export default function MaterialRow({ material, presets, onChange, onRemove, isZero }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activePresets = useMemo(
    () => presets.filter((p) => p.active !== false),
    [presets]
  );

  // Group presets by section if available
  const grouped = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = q
      ? activePresets.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            ((p as any).section ?? "").toLowerCase().includes(q)
        )
      : activePresets;

    const map = new Map<string, CatalogMaterial[]>();
    for (const p of filtered) {
      const key = (p as any).section ?? "Материалы";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [activePresets, search]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function update(patch: Partial<MaterialLine>) {
    onChange(updateMaterialSubtotal({ ...material, ...patch }));
  }

  function openDropdown() {
    setOpen(true);
    setTimeout(() => searchRef.current?.focus(), 0);
  }

  function selectPreset(p: CatalogMaterial) {
    update({ title: p.title, unit: p.unit, price: p.defaultPrice });
    setOpen(false);
    setSearch("");
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-wrap gap-2 items-start p-3 bg-white rounded-lg border transition-colors ${
        isZero ? "border-amber-400 bg-amber-50" : "border-gray-200"
      }`}
    >
      <div className="flex flex-wrap gap-2 items-center w-full">

        {/* ── Название (combobox) ─────────────────────── */}
        <div className="flex-grow min-w-[200px] relative">
          {!open ? (
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="Материал"
                className="border border-gray-300 rounded-l px-2 py-1.5 text-sm flex-1 min-w-0"
                value={material.title}
                onChange={(e) => update({ title: e.target.value })}
                onFocus={openDropdown}
              />
              <button
                type="button"
                onClick={openDropdown}
                className="border border-l-0 border-gray-300 rounded-r px-2 text-gray-400 hover:text-blue-500 hover:border-blue-400 transition-colors bg-white"
                title="Выбрать из каталога"
              >
                ▾
              </button>
            </div>
          ) : (
            <input
              ref={searchRef}
              type="text"
              placeholder="Поиск материала…"
              className="w-full border border-blue-400 rounded px-2 py-1.5 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") { setOpen(false); setSearch(""); }
                if (e.key === "Enter") {
                  const first = Array.from(grouped.values()).flat()[0];
                  if (first) selectPreset(first);
                }
              }}
            />
          )}

          {/* Dropdown */}
          {open && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {grouped.size === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-400 text-center">
                  Ничего не найдено
                </div>
              ) : (
                Array.from(grouped.entries()).map(([section, items]) => (
                  <div key={section}>
                    <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 sticky top-0 border-b border-gray-100">
                      {section}
                    </div>
                    {items.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-blue-50 transition-colors"
                        onMouseDown={() => selectPreset(p)}
                      >
                        <span className="flex-1 truncate">{p.title}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0 tabular-nums">
                          {p.defaultPrice > 0
                            ? `${p.defaultPrice.toLocaleString("ru-RU")} ₽/${p.unit}`
                            : p.unit}
                        </span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Единица ─────────────────────────────────── */}
        <UnitSelect value={material.unit} onChange={(v) => update({ unit: v })} />

        {/* ── Количество ──────────────────────────────── */}
        <input
          type="number"
          min={0}
          placeholder="Кол-во"
          className="border border-gray-300 rounded px-2 py-1.5 text-sm w-24 text-right"
          value={material.quantity || ""}
          onChange={(e) => update({ quantity: parseFloat(e.target.value) || 0 })}
        />

        {/* ── Цена ────────────────────────────────────── */}
        <input
          type="number"
          min={0}
          placeholder="Цена ₽"
          className="border border-gray-300 rounded px-2 py-1.5 text-sm w-28 text-right"
          value={material.price || ""}
          onChange={(e) => update({ price: parseFloat(e.target.value) || 0 })}
        />

        {/* ── Сумма ───────────────────────────────────── */}
        <span className="text-sm font-medium text-gray-700 w-24 text-right tabular-nums flex-shrink-0">
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

      {/* ── Комментарий ─────────────────────────────────── */}
      <input
        type="text"
        placeholder="Комментарий (необязательно)"
        className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-gray-500"
        value={material.comment ?? ""}
        onChange={(e) => update({ comment: e.target.value })}
      />
    </div>
  );
}
