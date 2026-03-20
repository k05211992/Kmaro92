"use client";

import { useEffect, useState } from "react";
import PrintDoc, { type PrintSettings } from "@/components/PrintDoc";
import type { Estimate, ProjectMeta } from "@/types";

interface PrintData {
  estimate: Estimate;
  meta: ProjectMeta;
}

function generateEstimateNumber(createdAt: string): string {
  const d = new Date(createdAt);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  // Стабильный суффикс из миллисекунд
  const suffix = String(d.getTime()).slice(-4);
  return `СМ-${y}${m}${day}-${suffix}`;
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-8 h-4 rounded-full transition-colors ${
          checked ? "bg-green-500" : "bg-gray-300"
        }`}
      >
        <div
          className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

export default function PrintPage() {
  const [data, setData] = useState<PrintData | null>(null);
  const [settings, setSettings] = useState<PrintSettings>({
    estimateNumber: "",
    showComments: false,
    showFinancialDetails: false,
  });

  useEffect(() => {
    const raw = sessionStorage.getItem("print_estimate");
    if (raw) {
      const parsed = JSON.parse(raw) as PrintData;
      setData(parsed);
      setSettings((s) => ({
        ...s,
        estimateNumber: generateEstimateNumber(parsed.estimate.createdAt),
      }));
    }
  }, []);

  if (!data) {
    return (
      <div className="p-8 text-gray-500">
        Нет данных для печати. Откройте главную страницу и нажмите «Распечатать».
      </div>
    );
  }

  return (
    <>
      <style>{`
        @page {
          size: A4;
          margin: 18mm 20mm;
        }
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print-doc { font-size: 11px; }
        }
        @media screen {
          body { background: #e5e7eb; }
          .print-doc-wrapper {
            background: white;
            max-width: 794px;
            margin: 0 auto;
            padding: 40px 48px;
            min-height: 1123px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          }
        }
      `}</style>

      {/* ─── Панель настроек (только на экране) ─────────────── */}
      <div className="no-print bg-gray-800 text-white px-6 py-3 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 uppercase tracking-wide">№ сметы</span>
          <input
            type="text"
            value={settings.estimateNumber}
            onChange={(e) =>
              setSettings((s) => ({ ...s, estimateNumber: e.target.value }))
            }
            className="bg-gray-700 text-white text-sm px-2 py-1 rounded font-mono w-40 border border-gray-600 focus:outline-none focus:border-green-400"
          />
        </div>

        <div className="flex items-center gap-4">
          <Toggle
            checked={settings.showComments}
            onChange={(v) => setSettings((s) => ({ ...s, showComments: v }))}
            label="Показывать комментарии"
          />
          <Toggle
            checked={settings.showFinancialDetails}
            onChange={(v) => setSettings((s) => ({ ...s, showFinancialDetails: v }))}
            label="Финансовая расшивка"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => window.print()}
            className="bg-green-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-green-500 transition-colors font-medium"
          >
            Печать / PDF
          </button>
          <button
            onClick={() => window.close()}
            className="border border-gray-600 text-gray-300 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>

      {/* ─── Превью / печатаемый документ ───────────────────── */}
      <div className="no-print py-8">
        <div className="print-doc-wrapper">
          <PrintDoc estimate={data.estimate} meta={data.meta} settings={settings} />
        </div>
      </div>

      {/* Для самой печати — без обёртки */}
      <div className="hidden print:block">
        <PrintDoc estimate={data.estimate} meta={data.meta} settings={settings} />
      </div>
    </>
  );
}
