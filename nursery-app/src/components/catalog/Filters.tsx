"use client";

import { useCatalog } from "@/context/CatalogContext";
import { useApp } from "@/context/AppContext";
import {
  LightCondition,
  MoistureCondition,
  HeightGroup,
  StockStatus,
  LIGHT_LABELS,
  MOISTURE_LABELS,
  HEIGHT_LABELS,
  STOCK_LABELS,
} from "@/types";
import { Input } from "@/components/ui/Input";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ---- Generic chip group ----
interface CheckGroupProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (values: T[]) => void;
}

function CheckGroup<T extends string>({
  label,
  options,
  selected,
  onChange,
}: CheckGroupProps<T>) {
  const toggle = (value: T) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs border transition-all",
                active
                  ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---- Category filter ----
function CategoryFilter() {
  const { filters, updateFilter, categories } = useCatalog();

  const toggle = (cat: string) => {
    if (filters.categories.includes(cat)) {
      updateFilter("categories", filters.categories.filter((c) => c !== cat));
    } else {
      updateFilter("categories", [...filters.categories, cat]);
    }
  };

  if (categories.length === 0) return null;

  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
        Категория
      </p>
      <div className="flex flex-col gap-0.5">
        {categories.map((cat) => {
          const active = filters.categories.includes(cat);
          return (
            <button
              key={cat}
              onClick={() => toggle(cat)}
              className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-left transition-colors",
                active
                  ? "bg-brand-50 text-brand-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full flex-shrink-0",
                  active ? "bg-brand-600" : "bg-gray-300"
                )}
              />
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---- Price range ----
function PriceRangeFilter() {
  const { filters, updateFilter } = useCatalog();

  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
        Цена, руб.
      </p>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="От"
          value={filters.price_min}
          onChange={(e) => updateFilter("price_min", e.target.value)}
          className="text-sm py-1.5"
          min={0}
        />
        <span className="text-gray-300 flex-shrink-0">—</span>
        <Input
          type="number"
          placeholder="До"
          value={filters.price_max}
          onChange={(e) => updateFilter("price_max", e.target.value)}
          className="text-sm py-1.5"
          min={0}
        />
      </div>
    </div>
  );
}

function countActiveFilters(f: ReturnType<typeof useCatalog>["filters"]): number {
  let n = 0;
  if (f.categories.length) n++;
  if (f.light.length) n++;
  if (f.moisture.length) n++;
  if (f.height_group.length) n++;
  if (f.stock_status.length) n++;
  if (f.price_min || f.price_max) n++;
  return n;
}

// ---- Main Filters ----
export function Filters({ className }: { className?: string }) {
  const { filters, updateFilter, resetFilters, filteredPlants } = useCatalog();
  const { plants } = useApp();
  const activeCount = countActiveFilters(filters);

  return (
    <aside className={cn("flex flex-col gap-5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800 text-sm">Фильтры</span>
          {activeCount > 0 && (
            <span className="bg-brand-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={resetFilters}
            className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
          >
            <X size={11} />
            Сбросить
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 -mt-2">
        {filteredPlants.length} из {plants.length} позиций
      </p>

      <div className="h-px bg-gray-100" />

      <CategoryFilter />

      <div className="h-px bg-gray-100" />

      <CheckGroup<LightCondition>
        label="Освещение"
        options={[
          { value: "sun", label: LIGHT_LABELS.sun },
          { value: "partial_shade", label: LIGHT_LABELS.partial_shade },
          { value: "shade", label: LIGHT_LABELS.shade },
        ]}
        selected={filters.light}
        onChange={(v) => updateFilter("light", v)}
      />

      <CheckGroup<MoistureCondition>
        label="Влажность"
        options={[
          { value: "dry", label: MOISTURE_LABELS.dry },
          { value: "moderate", label: MOISTURE_LABELS.moderate },
          { value: "wet", label: MOISTURE_LABELS.wet },
        ]}
        selected={filters.moisture}
        onChange={(v) => updateFilter("moisture", v)}
      />

      <CheckGroup<HeightGroup>
        label="Высота"
        options={[
          { value: "under_20", label: HEIGHT_LABELS.under_20 },
          { value: "20_50", label: HEIGHT_LABELS["20_50"] },
          { value: "50_100", label: HEIGHT_LABELS["50_100"] },
          { value: "over_100", label: HEIGHT_LABELS.over_100 },
        ]}
        selected={filters.height_group}
        onChange={(v) => updateFilter("height_group", v)}
      />

      <div className="h-px bg-gray-100" />

      <CheckGroup<StockStatus>
        label="Наличие"
        options={[
          { value: "in_stock", label: STOCK_LABELS.in_stock },
          { value: "low", label: STOCK_LABELS.low },
          { value: "order", label: STOCK_LABELS.order },
          { value: "out", label: STOCK_LABELS.out },
        ]}
        selected={filters.stock_status}
        onChange={(v) => updateFilter("stock_status", v)}
      />

      <PriceRangeFilter />
    </aside>
  );
}
