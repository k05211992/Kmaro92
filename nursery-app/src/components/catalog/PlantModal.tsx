"use client";

import Image from "next/image";
import {
  Sun,
  Droplets,
  Ruler,
  Thermometer,
  Leaf,
  ShoppingCart,
  Package,
} from "lucide-react";
import type { Plant } from "@/types";
import {
  LIGHT_LABELS,
  MOISTURE_LABELS,
  HEIGHT_LABELS,
  STOCK_LABELS,
} from "@/types";
import { Modal } from "@/components/ui/Modal";
import { StockBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { useQuote } from "@/context/QuoteContext";

interface PlantModalProps {
  plant: Plant | null;
  onClose: () => void;
}

interface DetailRowProps {
  icon?: React.ReactNode;
  label: string;
  value?: string | number | boolean | null;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  if (!value && value !== 0) return null;
  const display =
    typeof value === "boolean" ? (value ? "Да" : "Нет") : String(value);
  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
      {icon && <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>}
      <span className="text-sm text-gray-500 min-w-[120px] flex-shrink-0">
        {label}
      </span>
      <span className="text-sm text-gray-900 font-medium">{display}</span>
    </div>
  );
}

export function PlantModal({ plant, onClose }: PlantModalProps) {
  const { addItem, isInQuote } = useQuote();

  if (!plant) return null;

  const inQuote = isInQuote(plant.id);

  const handleAdd = () => {
    addItem(plant, "retail");
    onClose();
  };

  return (
    <Modal open={!!plant} onClose={onClose} maxWidth="xl">
      <div className="flex flex-col md:flex-row max-h-[85vh] overflow-hidden">
        {/* Image section */}
        <div className="md:w-72 flex-shrink-0 bg-gray-50 relative">
          <div className="aspect-square md:aspect-auto md:h-full relative min-h-48">
            {plant.image_url ? (
              <Image
                src={plant.image_url}
                alt={plant.name}
                fill
                className="object-cover"
                sizes="288px"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-8 min-h-48">
                <Leaf className="text-brand-300" size={56} />
                <p className="text-xs text-gray-400 text-center">Фото недоступно</p>
              </div>
            )}
          </div>
        </div>

        {/* Details section */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Category + badges */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs text-brand-600 font-medium uppercase tracking-wide">
                {plant.category}
                {plant.subcategory ? ` / ${plant.subcategory}` : ""}
              </span>
              <StockBadge status={plant.stock_status} />
            </div>

            {/* Name */}
            <h2 className="text-xl font-bold text-gray-900 mt-1">{plant.name}</h2>
            {plant.latin_name && (
              <p className="text-sm text-gray-400 italic">{plant.latin_name}</p>
            )}

            {/* Prices block */}
            <div className="mt-4 p-4 bg-brand-50 rounded-xl">
              <div className="flex items-end gap-6 flex-wrap">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Цена (розница)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(plant.price_retail)}
                  </p>
                </div>
                {plant.price_wholesale && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Цена (опт)</p>
                    <p className="text-xl font-semibold text-brand-700">
                      {formatCurrency(plant.price_wholesale)}
                    </p>
                  </div>
                )}
                {plant.discount_default > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Скидка</p>
                    <p className="text-lg font-semibold text-green-600">
                      {plant.discount_default}%
                    </p>
                  </div>
                )}
              </div>
              {plant.stock_qty !== undefined && (
                <p className="text-xs text-gray-400 mt-2">
                  В наличии: {plant.stock_qty} шт.
                </p>
              )}
            </div>

            {/* Description */}
            {plant.description && (
              <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                {plant.description}
              </p>
            )}

            {/* Details table */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Характеристики
              </p>
              <div className="divide-y divide-gray-50">
                <DetailRow label="Сорт / вид" value={plant.variety} />
                <DetailRow
                  label="Контейнер"
                  value={plant.container}
                  icon={<Package size={14} />}
                />
                <DetailRow label="Размер" value={plant.size} icon={<Ruler size={14} />} />
                <DetailRow
                  label="Освещение"
                  value={plant.light ? LIGHT_LABELS[plant.light] : undefined}
                  icon={<Sun size={14} />}
                />
                <DetailRow
                  label="Влажность"
                  value={plant.moisture ? MOISTURE_LABELS[plant.moisture] : undefined}
                  icon={<Droplets size={14} />}
                />
                <DetailRow
                  label="Высота"
                  value={
                    plant.height_group
                      ? HEIGHT_LABELS[plant.height_group]
                      : undefined
                  }
                  icon={<Ruler size={14} />}
                />
                <DetailRow
                  label="Зона морозост."
                  value={plant.frost_zone}
                  icon={<Thermometer size={14} />}
                />
                <DetailRow label="Срок на месте" value={plant.lifespan_group} />
                <DetailRow label="Цвет цветков" value={plant.flower_color} />
                <DetailRow label="Окраска листвы" value={plant.leaf_color} />
                <DetailRow
                  label="Природный сад"
                  value={plant.natural_garden ? "Да" : undefined}
                />
                <DetailRow
                  label="Лек. свойства"
                  value={plant.medicinal ? "Да" : undefined}
                />
              </div>
            </div>

            {/* Notes */}
            {plant.notes && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <p className="text-xs font-semibold text-yellow-700 mb-1">
                  Примечания
                </p>
                <p className="text-sm text-yellow-800">{plant.notes}</p>
              </div>
            )}

            {/* CTA */}
            <div className="mt-6">
              <Button
                variant={inQuote ? "secondary" : "primary"}
                size="lg"
                className="w-full"
                onClick={handleAdd}
                disabled={plant.stock_status === "out"}
              >
                <ShoppingCart size={18} />
                {inQuote
                  ? "Ещё раз в корзину"
                  : plant.stock_status === "out"
                  ? "Нет в наличии"
                  : "В корзину"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
