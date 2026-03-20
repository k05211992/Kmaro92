"use client";

import type { FinancialTerms, DiscountMarkupType } from "@/types";

interface Props {
  terms: FinancialTerms;
  onChange: (updated: FinancialTerms) => void;
}

function TypeToggle({
  value,
  onChange,
}: {
  value: DiscountMarkupType;
  onChange: (v: DiscountMarkupType) => void;
}) {
  return (
    <div className="flex rounded overflow-hidden border border-gray-300 flex-shrink-0">
      {(["percent", "fixed"] as const).map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-2 py-1.5 text-xs font-medium transition-colors ${
            value === t
              ? "bg-gray-700 text-white"
              : "bg-white text-gray-500 hover:bg-gray-50"
          }`}
        >
          {t === "percent" ? "%" : "₽"}
        </button>
      ))}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 w-32 flex-shrink-0">{label}</span>
      {children}
    </div>
  );
}

export default function FinancialTermsForm({ terms, onChange }: Props) {
  function patch(update: Partial<FinancialTerms>) {
    onChange({ ...terms, ...update });
  }

  return (
    <div className="space-y-3">
      {/* Наценка */}
      <Row label="Наценка">
        <TypeToggle
          value={terms.markupType}
          onChange={(v) => patch({ markupType: v, markupValue: 0 })}
        />
        <input
          type="number"
          min={0}
          max={terms.markupType === "percent" ? 999 : undefined}
          placeholder="0"
          className="border border-gray-300 rounded px-2 py-1.5 text-sm w-28 text-right"
          value={terms.markupValue || ""}
          onChange={(e) => patch({ markupValue: parseFloat(e.target.value) || 0 })}
        />
        <span className="text-xs text-gray-400">
          {terms.markupType === "percent" ? "%" : "₽"}
        </span>
      </Row>

      {/* Скидка */}
      <Row label="Скидка">
        <TypeToggle
          value={terms.discountType}
          onChange={(v) => patch({ discountType: v, discountValue: 0 })}
        />
        <input
          type="number"
          min={0}
          max={terms.discountType === "percent" ? 100 : undefined}
          placeholder="0"
          className="border border-gray-300 rounded px-2 py-1.5 text-sm w-28 text-right"
          value={terms.discountValue || ""}
          onChange={(e) => patch({ discountValue: parseFloat(e.target.value) || 0 })}
        />
        <span className="text-xs text-gray-400">
          {terms.discountType === "percent" ? "%" : "₽"}
        </span>
      </Row>

      {/* Минимальный заказ */}
      <Row label="Мин. заказ">
        <input
          type="number"
          min={0}
          placeholder="0"
          className="border border-gray-300 rounded px-2 py-1.5 text-sm w-36 text-right"
          value={terms.minimumOrderAmount || ""}
          onChange={(e) =>
            patch({ minimumOrderAmount: parseFloat(e.target.value) || 0 })
          }
        />
        <span className="text-xs text-gray-400">₽</span>
      </Row>

      {/* Предоплата */}
      <Row label="Предоплата">
        <input
          type="number"
          min={0}
          max={100}
          placeholder="0"
          className="border border-gray-300 rounded px-2 py-1.5 text-sm w-28 text-right"
          value={terms.prepaymentPercent || ""}
          onChange={(e) =>
            patch({ prepaymentPercent: parseFloat(e.target.value) || 0 })
          }
        />
        <span className="text-xs text-gray-400">%</span>
      </Row>
    </div>
  );
}
