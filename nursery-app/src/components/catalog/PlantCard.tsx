"use client";

import Image from "next/image";
import { ShoppingCart, Leaf, Sun, Droplets, Check } from "lucide-react";
import type { Plant } from "@/types";
import { LIGHT_LABELS, MOISTURE_LABELS } from "@/types";
import { StockBadge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { useQuote } from "@/context/QuoteContext";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

function PlantPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50">
      <Leaf className="text-gray-300" size={40} />
    </div>
  );
}

interface PlantCardProps {
  plant: Plant;
  onDetails: (plant: Plant) => void;
}

export function PlantCard({ plant, onDetails }: PlantCardProps) {
  const { addItem, isInQuote } = useQuote();
  const { mode } = useApp();
  const inQuote = isInQuote(plant.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const priceType =
      mode === "manager" && plant.price_wholesale ? "wholesale" : "retail";
    addItem(plant, priceType);
  };

  const isOut = plant.stock_status === "out";

  return (
    <div
      className={cn(
        "group bg-white rounded-2xl overflow-hidden border border-gray-100",
        "hover:shadow-lg hover:border-gray-200 transition-all duration-200",
        "flex flex-col cursor-pointer"
      )}
      onClick={() => onDetails(plant)}
    >
      {/* Square image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 flex-shrink-0">
        {plant.image_url ? (
          <Image
            src={plant.image_url}
            alt={plant.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <PlantPlaceholder />
        )}
        {/* Stock badge */}
        <div className="absolute top-2.5 left-2.5">
          <StockBadge status={plant.stock_status} />
        </div>
        {/* In-quote indicator */}
        {inQuote && (
          <div className="absolute top-2.5 right-2.5 bg-brand-600 text-white rounded-full p-1.5 shadow">
            <Check size={11} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col p-3 flex-1 gap-1.5">
        {/* Category */}
        <p className="text-[10px] font-semibold text-brand-600 uppercase tracking-widest truncate">
          {plant.category}
          {plant.subcategory ? ` · ${plant.subcategory}` : ""}
        </p>

        {/* Name */}
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
            {plant.name}
          </h3>
          {plant.latin_name && (
            <p className="text-[11px] text-gray-400 italic mt-0.5 truncate">
              {plant.latin_name}
            </p>
          )}
        </div>

        {/* Tags */}
        {(plant.variety || plant.container || plant.size) && (
          <div className="flex flex-wrap gap-1">
            {plant.variety && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">
                {plant.variety}
              </span>
            )}
            {(plant.container || plant.size) && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">
                {[plant.container, plant.size].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
        )}

        {/* Conditions */}
        {(plant.light || plant.moisture) && (
          <div className="flex items-center gap-2.5 text-[11px] text-gray-400">
            {plant.light && (
              <span className="flex items-center gap-1">
                <Sun size={11} />
                {LIGHT_LABELS[plant.light]}
              </span>
            )}
            {plant.moisture && (
              <span className="flex items-center gap-1">
                <Droplets size={11} />
                {MOISTURE_LABELS[plant.moisture]}
              </span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price */}
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-base font-bold text-gray-900">
            {formatCurrency(plant.price_retail)}
          </span>
          {plant.price_wholesale && (
            <span className="text-xs text-gray-400">
              опт {formatCurrency(plant.price_wholesale)}
            </span>
          )}
        </div>
        {plant.discount_default > 0 && (
          <p className="text-xs text-emerald-600 font-medium -mt-1">
            Скидка {plant.discount_default}%
          </p>
        )}

        {/* Single action button */}
        <button
          disabled={isOut}
          className={cn(
            "mt-1 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-colors",
            isOut
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : inQuote
              ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
              : "bg-brand-600 text-white hover:bg-brand-700"
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (!isOut) handleAdd(e);
          }}
        >
          {isOut ? (
            "Нет в наличии"
          ) : inQuote ? (
            <>
              <Check size={14} />
              В подборке
            </>
          ) : (
            <>
              <ShoppingCart size={14} />
              В КП
            </>
          )}
        </button>
      </div>
    </div>
  );
}
