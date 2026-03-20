"use client";

import { formatRub } from "@/lib/calc";
import type { SavedEstimate } from "@/types";

interface Props {
  history: SavedEstimate[];
  onOpen: (entry: SavedEstimate) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPanel({
  history,
  onOpen,
  onDuplicate,
  onDelete,
}: Props) {
  if (history.length === 0) {
    return (
      <p className="text-gray-400 text-sm text-center py-6">
        История пуста. Сохраните смету — она появится здесь.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {history.map((entry) => (
        <li
          key={entry.id}
          className="border border-gray-200 rounded-lg p-3 bg-white hover:border-gray-300 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-medium text-gray-800 truncate text-sm">
                {entry.meta.clientName || "Без имени"}
              </div>
              {entry.meta.address && (
                <div className="text-xs text-gray-500 truncate mt-0.5">
                  {entry.meta.address}
                </div>
              )}
              <div className="text-xs text-gray-400 mt-1">
                {formatDate(entry.createdAt)}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-semibold text-green-700">
                {formatRub(entry.total)}
              </div>
              <div className="text-xs text-gray-400">
                ×{entry.complexityCoeff.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => onOpen(entry)}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              Открыть
            </button>
            <span className="text-gray-200">|</span>
            <button
              onClick={() => onDuplicate(entry.id)}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Дублировать
            </button>
            <span className="text-gray-200">|</span>
            <button
              onClick={() => onDelete(entry.id)}
              className="text-xs text-red-400 hover:text-red-600 transition-colors ml-auto"
            >
              Удалить
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
