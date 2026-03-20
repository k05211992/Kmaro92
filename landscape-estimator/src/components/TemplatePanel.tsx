"use client";

import { useState } from "react";
import type { EstimateTemplate, WorkInput, ManualLine, MaterialLine, ExtraCost } from "@/types";
import { getAllTemplates, saveTemplate, deleteTemplate } from "@/lib/templateStorage";

interface Props {
  onApply: (template: EstimateTemplate) => void;
  onSaveAsTemplate: (name: string, description: string) => void;
}

export default function TemplatePanel({ onApply, onSaveAsTemplate }: Props) {
  const [templates, setTemplates] = useState<EstimateTemplate[]>(() => getAllTemplates());
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  function refresh() {
    setTemplates(getAllTemplates());
  }

  function handleDelete(id: string) {
    deleteTemplate(id);
    refresh();
  }

  function handleSave() {
    if (!newName.trim()) return;
    onSaveAsTemplate(newName.trim(), newDesc.trim());
    setNewName("");
    setNewDesc("");
    setSaving(false);
    refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Save current as template */}
      <div className="border border-green-200 rounded-lg bg-green-50 p-3">
        {saving ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-green-800">Сохранить текущую смету как шаблон</p>
            <input
              type="text"
              placeholder="Название шаблона *"
              className="border border-gray-300 rounded px-2 py-1.5 text-sm w-full"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <input
              type="text"
              placeholder="Описание (необязательно)"
              className="border border-gray-300 rounded px-2 py-1.5 text-sm w-full"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!newName.trim()}
                className="flex-1 bg-green-600 text-white text-sm rounded py-1.5 hover:bg-green-700 disabled:opacity-40 transition-colors"
              >
                Сохранить
              </button>
              <button
                onClick={() => { setSaving(false); setNewName(""); setNewDesc(""); }}
                className="flex-1 bg-gray-200 text-gray-700 text-sm rounded py-1.5 hover:bg-gray-300 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setSaving(true)}
            className="w-full text-sm text-green-700 font-medium hover:text-green-900 transition-colors"
          >
            + Сохранить текущую смету как шаблон
          </button>
        )}
      </div>

      {/* Template list */}
      <div className="flex flex-col gap-2">
        {templates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="border border-gray-200 rounded-lg bg-white p-3 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-800 truncate">{tmpl.name}</span>
                  {tmpl.isBuiltIn && (
                    <span className="shrink-0 text-[10px] bg-blue-100 text-blue-600 rounded px-1.5 py-0.5 font-medium">
                      встроен.
                    </span>
                  )}
                </div>
                {tmpl.description && (
                  <p className="text-xs text-gray-500 mt-0.5 leading-tight">{tmpl.description}</p>
                )}
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-400">
                  <span>{tmpl.inputs.length} позиц. работ</span>
                  {(tmpl.materials?.length ?? 0) > 0 && <span>{tmpl.materials!.length} матер.</span>}
                  {(tmpl.extraCosts?.length ?? 0) > 0 && <span>{tmpl.extraCosts!.length} доп.расх.</span>}
                  {tmpl.complexityCoeff && tmpl.complexityCoeff !== 1 && (
                    <span>k={tmpl.complexityCoeff}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => onApply(tmpl)}
                  className="text-xs bg-blue-600 text-white rounded px-2.5 py-1 hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  Применить
                </button>
                {!tmpl.isBuiltIn && (
                  <button
                    onClick={() => handleDelete(tmpl.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors text-center"
                    title="Удалить шаблон"
                  >
                    Удалить
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
