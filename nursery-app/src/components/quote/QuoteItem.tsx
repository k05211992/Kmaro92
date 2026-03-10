"use client";

import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { QuoteItem as QuoteItemType } from "@/types";
import { PRICE_TYPE_LABELS } from "@/types";
import { useQuote, getEffectivePrice, getLineTotal } from "@/context/QuoteContext";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface QuoteItemProps {
  item: QuoteItemType;
}

export function QuoteItemRow({ item }: QuoteItemProps) {
  const { removeItem, updateQuantity, updateDiscount, updatePriceType } =
    useQuote();
  const { mode } = useApp();
  const isManager = mode === "manager";

  const price = getEffectivePrice(item);
  const lineTotal = getLineTotal(item);

  return (
    <div className="py-3 border-b border-gray-50 last:border-0">
      {/* Name + delete */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 leading-tight truncate">
            {item.plant.name}
          </p>
          {(item.plant.container || item.plant.size) && (
            <p className="text-xs text-gray-400 mt-0.5">
              {[item.plant.container, item.plant.size].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
        <button
          onClick={() => removeItem(item.id)}
          className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
          aria-label="Удалить позицию"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Quantity stepper */}
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
          >
            <ChevronDown size={14} />
          </button>
          <input
            type="number"
            value={item.quantity}
            min={1}
            step={1}
            onChange={(e) =>
              updateQuantity(item.id, parseInt(e.target.value, 10) || 1)
            }
            className="w-10 text-center text-sm font-medium bg-white border-0 focus:outline-none py-0.5"
          />
          <button
            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
          >
            <ChevronUp size={14} />
          </button>
        </div>

        {/* Price type (manager only) */}
        {isManager && item.plant.price_wholesale && (
          <select
            value={item.price_type}
            onChange={(e) =>
              updatePriceType(item.id, e.target.value as "retail" | "wholesale")
            }
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-400"
          >
            <option value="retail">{PRICE_TYPE_LABELS.retail}</option>
            <option value="wholesale">{PRICE_TYPE_LABELS.wholesale}</option>
          </select>
        )}

        {/* Discount (manager only) */}
        {isManager && (
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={item.discount}
              min={0}
              max={100}
              onChange={(e) =>
                updateDiscount(item.id, parseFloat(e.target.value) || 0)
              }
              className="w-12 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-400 text-center"
            />
            <span className="text-xs text-gray-400">%</span>
          </div>
        )}
      </div>

      {/* Price summary */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-400">
          {formatCurrency(price)} × {item.quantity}
          {item.discount > 0 && (
            <span className="text-green-600 ml-1">−{item.discount}%</span>
          )}
        </p>
        <p
          className={cn(
            "text-sm font-semibold",
            item.discount > 0 ? "text-brand-700" : "text-gray-900"
          )}
        >
          {formatCurrency(lineTotal)}
        </p>
      </div>
    </div>
  );
}
