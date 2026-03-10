"use client";

import Image from "next/image";
import { ShoppingCart, Info, Leaf, Sun, Droplets } from "lucide-react";
import type { Plant } from "@/types";
import { LIGHT_LABELS, MOISTURE_LABELS } from "@/types";
import { StockBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { useQuote } from "@/context/QuoteContext";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

// Placeholder SVG for plants without photos
function PlantPlaceholder() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-brand-50">
      <Leaf className="text-brand-300" size={40} />
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
    // Manager with wholesale price available → default to wholesale
    const priceType =
      mode === "manager" && plant.price_wholesale ? "wholesale" : "retail";
    addItem(plant, priceType);
  };

  return (
    <div
      className={cn(
        "group bg-white rounded-xl border border-gray-100 overflow-hidden",
        "hover:shadow-md hover:border-brand-200 transition-all duration-200",
        "flex flex-col cursor-pointer"
      )}
      onClick={() => onDetails(plant)}
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-gray-50 flex-shrink-0">
        {plant.image_url ? (
          <Image
            src={plant.image_url}
            alt={plant.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onError={(e) => {
              // Hide broken image
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <PlantPlaceholder />
        )}
        {/* Stock badge overlay */}
        <div className="absolute top-2 left-2">
          <StockBadge status={plant.stock_status} />
        </div>
        {/* In-quote indicator */}
        {inQuote && (
          <div className="absolute top-2 right-2 bg-brand-600 text-white rounded-full p-1">
            <ShoppingCart size={12} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        {/* Category */}
        <p className="text-xs text-brand-600 font-medium uppercase tracking-wide truncate">
          {plant.category}
          {plant.subcategory ? ` / ${plant.subcategory}` : ""}
        </p>

        {/* Name */}
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
            {plant.name}
          </h3>
          {plant.latin_name && (
            <p className="text-xs text-gray-400 italic mt-0.5 truncate">
              {plant.latin_name}
            </p>
          )}
        </div>

        {/* Variety / Container */}
        <div className="flex flex-wrap gap-1">
          {plant.variety && (
            <span className="text-xs bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded">
              {plant.variety}
            </span>
          )}
          {(plant.size || plant.container) && (
            <span className="text-xs bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded">
              {[plant.container, plant.size].filter(Boolean).join(", ")}
            </span>
          )}
        </div>

        {/* Conditions icons */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {plant.light && (
            <span className="flex items-center gap-1">
              <Sun size={12} />
              {LIGHT_LABELS[plant.light]}
            </span>
          )}
          {plant.moisture && (
            <span className="flex items-center gap-1">
              <Droplets size={12} />
              {MOISTURE_LABELS[plant.moisture]}
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Prices */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(plant.price_retail)}
            </p>
            {plant.price_wholesale && (
              <p className="text-xs text-gray-400">
                Опт: {formatCurrency(plant.price_wholesale)}
              </p>
            )}
            {plant.discount_default > 0 && (
              <p className="text-xs text-green-600 font-medium">
                Скидка {plant.discount_default}%
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onDetails(plant)}
          >
            <Info size={14} />
            Подробнее
          </Button>
          <Button
            variant={inQuote ? "secondary" : "primary"}
            size="sm"
            className="flex-1"
            onClick={handleAdd}
            disabled={plant.stock_status === "out"}
          >
            <ShoppingCart size={14} />
            {inQuote ? "Ещё раз" : "В корзину"}
          </Button>
        </div>
      </div>
    </div>
  );
}
