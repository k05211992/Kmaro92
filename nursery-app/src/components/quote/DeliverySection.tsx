"use client";

import { useQuote } from "@/context/QuoteContext";
import { useApp } from "@/context/AppContext";
import type { DeliveryType } from "@/types";
import { DELIVERY_TYPE_LABELS } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Truck } from "lucide-react";

const FIXED_DELIVERY_DEFAULT = 1500;

export function DeliverySection() {
  const { delivery_type, delivery_cost, updateDeliveryType, updateDeliveryCost } =
    useQuote();
  const { mode } = useApp();
  const isManager = mode === "manager";

  const handleTypeChange = (type: DeliveryType) => {
    updateDeliveryType(type);
    if (type === "fixed") {
      updateDeliveryCost(FIXED_DELIVERY_DEFAULT);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Truck size={14} className="text-gray-400" />
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Доставка
        </p>
      </div>

      {/* Delivery type selector */}
      <div className="flex flex-col gap-1.5">
        {(["fixed", "custom", "none"] as DeliveryType[]).map((type) => (
          <label
            key={type}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <input
              type="radio"
              name="delivery_type"
              value={type}
              checked={delivery_type === type}
              onChange={() => handleTypeChange(type)}
              className="accent-brand-600"
              disabled={!isManager && type !== "none"}
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
              {DELIVERY_TYPE_LABELS[type]}
              {type === "fixed" && isManager && (
                <span className="text-gray-400 ml-1">
                  ({formatCurrency(FIXED_DELIVERY_DEFAULT)})
                </span>
              )}
            </span>
          </label>
        ))}
      </div>

      {/* Custom delivery cost input — manager only */}
      {isManager && delivery_type === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={delivery_cost}
            min={0}
            onChange={(e) =>
              updateDeliveryCost(parseFloat(e.target.value) || 0)
            }
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Стоимость доставки"
          />
          <span className="text-sm text-gray-400">руб.</span>
        </div>
      )}

      {/* Cost display */}
      {delivery_type !== "none" && (
        <p className="text-sm font-medium text-gray-700">
          Итого доставка:{" "}
          <span className="text-brand-700">
            {formatCurrency(
              delivery_type === "fixed" ? FIXED_DELIVERY_DEFAULT : delivery_cost
            )}
          </span>
        </p>
      )}
    </div>
  );
}
