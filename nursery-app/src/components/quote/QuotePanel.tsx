"use client";

import { useState } from "react";
import {
  FileDown,
  Trash2,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { useQuote } from "@/context/QuoteContext";
import { useApp } from "@/context/AppContext";
import { generateQuoteExcel } from "@/lib/excel/writer";
import { formatCurrency, pluralPositions } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { QuoteItemRow } from "./QuoteItem";
import { QuoteClientForm } from "./QuoteClientForm";
import { DeliverySection } from "./DeliverySection";
import { cn } from "@/lib/utils";

interface QuotePanelProps {
  className?: string;
}

export function QuotePanel({ className }: QuotePanelProps) {
  const {
    items,
    totals,
    quote_number,
    created_at,
    client_info,
    delivery_type,
    delivery_cost,
    clearQuote,
  } = useQuote();
  const { isQuotePanelOpen, setQuotePanelOpen } = useApp();
  const [showClientForm, setShowClientForm] = useState(false);
  const [generating, setGenerating] = useState(false);

  const itemCount = items.reduce((acc, it) => acc + it.quantity, 0);
  const isEmpty = items.length === 0;

  const handleGenerateExcel = async () => {
    setGenerating(true);
    try {
      generateQuoteExcel({
        items,
        client_info,
        delivery_type,
        delivery_cost,
        quote_number,
        created_at,
        totals,
      });
    } catch (err) {
      alert("Ошибка при формировании КП. Попробуйте ещё раз.");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <aside
      className={cn(
        "flex flex-col bg-white border-l border-gray-100 h-full",
        className
      )}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} className="text-brand-600" />
          <h2 className="font-semibold text-gray-900 text-sm">Подборка / КП</h2>
          {itemCount > 0 && (
            <span className="bg-brand-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
              {itemCount}
            </span>
          )}
        </div>
        {/* Mobile close button */}
        <button
          className="md:hidden text-gray-400 hover:text-gray-600"
          onClick={() => setQuotePanelOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      {/* Quote number */}
      {!isEmpty && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-400">
            № КП:{" "}
            <span className="font-medium text-gray-600">{quote_number}</span>
          </p>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <ShoppingCart className="text-gray-200 mb-3" size={40} />
          <p className="text-sm font-medium text-gray-500">Подборка пуста</p>
          <p className="text-xs text-gray-400 mt-1">
            Добавляйте растения из каталога
          </p>
        </div>
      )}

      {/* Items list */}
      {!isEmpty && (
        <div className="flex-1 overflow-y-auto px-4">
          {items.map((item) => (
            <QuoteItemRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Bottom section */}
      {!isEmpty && (
        <div className="border-t border-gray-100 flex-shrink-0">
          {/* Delivery */}
          <div className="px-4 py-3 border-b border-gray-50">
            <DeliverySection />
          </div>

          {/* Client form toggle */}
          <div className="px-4 py-3 border-b border-gray-50">
            <button
              className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wide"
              onClick={() => setShowClientForm((v) => !v)}
            >
              Данные клиента (для КП)
              {showClientForm ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
            {showClientForm && (
              <div className="mt-3">
                <QuoteClientForm />
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="px-4 py-3 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-500">
              <span>
                Позиций: {items.length} ({itemCount}{" "}
                {pluralPositions(itemCount)})
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Сумма</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Скидка</span>
                <span>−{formatCurrency(totals.discount_amount)}</span>
              </div>
            )}
            {totals.delivery > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Доставка</span>
                <span>{formatCurrency(totals.delivery)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-100 pt-2 mt-2">
              <span>Итого</span>
              <span className="text-brand-700">
                {formatCurrency(totals.total)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 pb-4 flex flex-col gap-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleGenerateExcel}
              loading={generating}
              disabled={isEmpty}
            >
              <FileDown size={18} />
              Сформировать КП (Excel)
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-gray-400 hover:text-red-500"
              onClick={() => {
                if (confirm("Очистить подборку?")) clearQuote();
              }}
            >
              <Trash2 size={14} />
              Очистить подборку
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
