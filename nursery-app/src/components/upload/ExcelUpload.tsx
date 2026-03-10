"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, CheckCircle, AlertCircle, FileSpreadsheet, X } from "lucide-react";
import { parseExcelFile } from "@/lib/excel/reader";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { ExcelImportResult } from "@/types";

interface ExcelUploadProps {
  onSuccess?: () => void;
}

export function ExcelUpload({ onSuccess }: ExcelUploadProps) {
  const { setPlants } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExcelImportResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      alert("Поддерживаются только файлы .xlsx и .xls");
      return;
    }

    setLoading(true);
    setResult(null);
    setFileName(file.name);

    try {
      const importResult = await parseExcelFile(file);
      setResult(importResult);

      if (importResult.plants.length > 0) {
        setPlants(importResult.plants);
        if (importResult.errors.length === 0) {
          onSuccess?.();
        }
      }
    } catch (err) {
      console.error("Excel parse error:", err);
      setResult({
        plants: [],
        errors: ["Не удалось прочитать файл. Проверьте формат."],
        warnings: [],
        total_rows: 0,
        imported_rows: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [setPlants, onSuccess]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const hasErrors = result && result.errors.length > 0;
  const hasWarnings = result && result.warnings.length > 0;
  const isSuccess = result && result.imported_rows > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          dragging
            ? "border-brand-400 bg-brand-50"
            : "border-gray-200 bg-gray-50 hover:border-brand-300 hover:bg-brand-50/30",
          loading && "pointer-events-none opacity-60"
        )}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center gap-3">
          {loading ? (
            <>
              <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Читаем файл...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
                <Upload className="text-brand-600" size={22} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Перетащите Excel-файл сюда или{" "}
                  <span className="text-brand-600 underline">выберите файл</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Поддерживаются форматы: .xlsx, .xls
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="flex flex-col gap-2">
          {/* File name */}
          {fileName && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileSpreadsheet size={14} className="text-green-600" />
              <span className="font-medium">{fileName}</span>
            </div>
          )}

          {/* Success message */}
          {isSuccess && (
            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Загружено успешно
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  Импортировано {result.imported_rows} из {result.total_rows}{" "}
                  растений
                </p>
              </div>
            </div>
          )}

          {/* Errors */}
          {hasErrors && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                <p className="text-sm font-medium text-red-800">
                  Ошибки ({result.errors.length})
                </p>
              </div>
              <ul className="flex flex-col gap-1">
                {result.errors.slice(0, 5).map((err, i) => (
                  <li key={i} className="text-xs text-red-700">
                    • {err}
                  </li>
                ))}
                {result.errors.length > 5 && (
                  <li className="text-xs text-red-500">
                    ...и ещё {result.errors.length - 5} ошибок
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {hasWarnings && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-yellow-500 flex-shrink-0" />
                <p className="text-sm font-medium text-yellow-800">
                  Предупреждения ({result.warnings.length})
                </p>
              </div>
              <ul className="flex flex-col gap-1">
                {result.warnings.slice(0, 3).map((w, i) => (
                  <li key={i} className="text-xs text-yellow-700">
                    • {w}
                  </li>
                ))}
                {result.warnings.length > 3 && (
                  <li className="text-xs text-yellow-500">
                    ...и ещё {result.warnings.length - 3}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
