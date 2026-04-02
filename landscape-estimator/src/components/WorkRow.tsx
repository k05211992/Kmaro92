"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { WorkInput, CatalogCategory } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkOption {
  categoryId: string;
  variantId: string;
  label: string;       // отображаемое название
  unit: string;
  unitPrice: number;
  section: string;     // для группировки в дропдауне
}

interface Props {
  input: WorkInput;
  categories: CatalogCategory[];
  onChange: (updated: WorkInput) => void;
  onRemove: () => void;
  isZero?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkRow({ input, categories, onChange, onRemove, isZero }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Flatten categories → variants into searchable options
  const allOptions = useMemo<WorkOption[]>(() => {
    return categories
      .filter((c) => c.active !== false)
      .flatMap((cat) =>
        cat.variants
          .filter((v) => v.active !== false)
          .map((v) => {
            // V2 works: category label === variant label → показываем одно название
            const label =
              v.label && v.label !== cat.label
                ? `${cat.label} — ${v.label}`
                : cat.label;
            return {
              categoryId: cat.id,
              variantId: v.id,
              label,
              unit: cat.unit,
              unitPrice: v.unitPrice,
              // V2 categories have section field; V1 fall back to label
              section: (cat as any).section ?? cat.label,
            };
          })
      );
  }, [categories]);

  // Resolve currently selected option
  const selected = useMemo(() => {
    return (
      allOptions.find(
        (o) =>
          o.categoryId === input.category &&
          (input.variant ? o.variantId === input.variant : true)
      ) ?? allOptions.find((o) => o.categoryId === input.category)
    );
  }, [allOptions, input.category, input.variant]);

  // Filtered + grouped options
  const grouped = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = q
      ? allOptions.filter(
          (o) =>
            o.label.toLowerCase().includes(q) ||
            o.section.toLowerCase().includes(q)
        )
      : allOptions;

    const map = new Map<string, WorkOption[]>();
    for (const opt of filtered) {
      if (!map.has(opt.section)) map.set(opt.section, []);
      map.get(opt.section)!.push(opt);
    }
    return map;
  }, [allOptions, search]);

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

  function openDropdown() {
    setOpen(true);
    setTimeout(() => searchRef.current?.focus(), 0);
  }

  function selectOption(opt: WorkOption) {
    onChange({ category: opt.categoryId, variant: opt.variantId, quantity: input.quantity });
    setOpen(false);
    setSearch("");
  }

  const unit = selected?.unit ?? "";

  return (
    <div
      ref={containerRef}
      className={`flex flex-wrap gap-2 items-center p-3 bg-white rounded-lg border transition-colors ${
        isZero ? "border-amber-400 bg-amber-50" : "border-gray-200"
      }`}
    >
      {/* ── Combobox ───────────────────────────────────── */}
      <div className="flex-1 min-w-[220px] relative">
        {/* Trigger button (closed state) */}
        {!open && (
          <button
            type="button"
            onClick={openDropdown}
            className="w-full text-left border border-gray-300 rounded px-2 py-1.5 text-sm truncate hover:border-blue-400 transition-colors bg-white"
          >
            {selected ? selected.label : (
              <span className="text-gray-400">Выбрать работу…</span>
            )}
          </button>
        )}

        {/* Search input (open state) */}
        {open && (
          <input
            ref={searchRef}
            type="text"
            placeholder="Поиск по названию или разделу…"
            className="w-full border border-blue-400 rounded px-2 py-1.5 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setOpen(false); setSearch(""); }
              if (e.key === "Enter") {
                const first = Array.from(grouped.values()).flat()[0];
                if (first) selectOption(first);
              }
            }}
          />
        )}

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-72 overflow-y-auto">
            {grouped.size === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">
                Ничего не найдено
              </div>
            ) : (
              Array.from(grouped.entries()).map(([section, opts]) => (
                <div key={section}>
                  {/* Section header */}
                  <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 sticky top-0 border-b border-gray-100">
                    {section}
                  </div>
                  {opts.map((opt) => (
                    <button
                      key={`${opt.categoryId}__${opt.variantId}`}
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-blue-50 transition-colors ${
                        opt.categoryId === input.category && opt.variantId === input.variant
                          ? "bg-blue-50 text-blue-700"
                          : ""
                      }`}
                      onMouseDown={() => selectOption(opt)}
                    >
                      <span className="flex-1 truncate">{opt.label}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0 tabular-nums">
                        {opt.unitPrice > 0
                          ? `${opt.unitPrice.toLocaleString("ru-RU")} ₽/${opt.unit}`
                          : opt.unit}
                      </span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Price badge ─────────────────────────────────── */}
      {selected && selected.unitPrice > 0 && (
        <span className="text-xs text-gray-400 flex-shrink-0 tabular-nums">
          {selected.unitPrice.toLocaleString("ru-RU")} ₽/{unit}
        </span>
      )}

      {/* ── Quantity ────────────────────────────────────── */}
      <div className="flex items-center gap-1 flex-shrink-0">
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
        {unit && (
          <span className="text-sm text-gray-500 w-10 flex-shrink-0">{unit}</span>
        )}
      </div>

      {/* ── Remove ──────────────────────────────────────── */}
      <button
        onClick={onRemove}
        className="ml-auto text-gray-400 hover:text-red-500 transition-colors text-lg leading-none flex-shrink-0"
        title="Удалить строку"
      >
        ×
      </button>
    </div>
  );
}
