"use client";

import WorkRow from "@/components/WorkRow";
import ManualLineRow from "@/components/ManualLineRow";
import MaterialRow from "@/components/MaterialRow";
import ExtraCostRow from "@/components/ExtraCostRow";
import {
  makeMaterial,
  makeExtraCost,
  makeManualLine,
  updateMaterialSubtotal,
} from "@/lib/calc";
import type {
  EstimateSection,
  Catalog,
  OrgCostItem,
  SectionType,
  WorkInput,
  ManualLine,
  MaterialLine,
  ExtraCost,
} from "@/types";

interface Props {
  section: EstimateSection;
  catalog: Catalog;
  extraSuggestions: string[];
  onChange: (updated: EstimateSection) => void;
  onRemove: () => void;
  canRemove?: boolean;
}

const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  standard: "Работы + материалы",
  extra_costs: "Доп. расходы",
  org_costs: "Орг. затраты (%)",
};

const SECTION_TYPE_COLORS: Record<SectionType, string> = {
  standard: "bg-blue-50 text-blue-700 border-blue-200",
  extra_costs: "bg-orange-50 text-orange-700 border-orange-200",
  org_costs: "bg-purple-50 text-purple-700 border-purple-200",
};

function OrgCostRow({
  item,
  onChange,
  onRemove,
}: {
  item: OrgCostItem;
  onChange: (updated: OrgCostItem) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 items-center p-3 bg-white rounded-lg border border-gray-200">
      <input
        type="text"
        placeholder="Статья затрат"
        className="border border-gray-300 rounded px-2 py-1.5 text-sm flex-grow min-w-[160px]"
        value={item.title}
        onChange={(e) => onChange({ ...item, title: e.target.value })}
      />
      <select
        className="border border-gray-300 rounded px-2 py-1.5 text-sm"
        value={item.type}
        onChange={(e) =>
          onChange({ ...item, type: e.target.value as "percent" | "fixed" })
        }
      >
        <option value="percent">%</option>
        <option value="fixed">₽ фикс.</option>
      </select>
      <input
        type="number"
        min={0}
        step={item.type === "percent" ? 0.1 : 100}
        placeholder={item.type === "percent" ? "%" : "₽"}
        className="border border-gray-300 rounded px-2 py-1.5 text-sm w-28 text-right"
        value={item.value || ""}
        onChange={(e) =>
          onChange({ ...item, value: parseFloat(e.target.value) || 0 })
        }
      />
      <input
        type="text"
        placeholder="Примечание"
        className="border border-gray-300 rounded px-2 py-1.5 text-sm flex-grow min-w-[120px]"
        value={item.note ?? ""}
        onChange={(e) => onChange({ ...item, note: e.target.value })}
      />
      <button
        onClick={onRemove}
        className="ml-auto text-gray-400 hover:text-red-500 transition-colors text-lg leading-none"
        title="Удалить"
      >
        ×
      </button>
    </div>
  );
}

export default function SectionPanel({
  section,
  catalog,
  extraSuggestions,
  onChange,
  onRemove,
  canRemove = true,
}: Props) {
  const defaultCategory =
    catalog.works.find((w) => w.active !== false)?.id ?? "lawn";

  // ─── Helpers ──────────────────────────────────────────────────────

  function update(patch: Partial<EstimateSection>) {
    onChange({ ...section, ...patch });
  }

  // Catalog items
  function setCatalogItem(index: number, value: WorkInput) {
    const updated = [...section.catalogItems];
    updated[index] = value;
    update({ catalogItems: updated });
  }
  function addCatalogItem() {
    update({ catalogItems: [...section.catalogItems, { category: defaultCategory, quantity: 0 }] });
  }
  function removeCatalogItem(index: number) {
    update({ catalogItems: section.catalogItems.filter((_, i) => i !== index) });
  }

  // Manual items
  function addManualItem() {
    update({ manualItems: [...section.manualItems, makeManualLine()] });
  }
  function setManualItem(index: number, value: ManualLine) {
    const updated = [...section.manualItems];
    updated[index] = value;
    update({ manualItems: updated });
  }
  function removeManualItem(index: number) {
    update({ manualItems: section.manualItems.filter((_, i) => i !== index) });
  }

  // Materials
  function addMaterial() {
    update({ materials: [...section.materials, makeMaterial()] });
  }
  function setMaterial(index: number, value: MaterialLine) {
    const updated = [...section.materials];
    updated[index] = updateMaterialSubtotal(value);
    update({ materials: updated });
  }
  function removeMaterial(index: number) {
    update({ materials: section.materials.filter((_, i) => i !== index) });
  }

  // Extra items
  function addExtraItem() {
    update({ extraItems: [...section.extraItems, makeExtraCost()] });
  }
  function setExtraItem(index: number, value: ExtraCost) {
    const updated = [...section.extraItems];
    updated[index] = value;
    update({ extraItems: updated });
  }
  function removeExtraItem(index: number) {
    update({ extraItems: section.extraItems.filter((_, i) => i !== index) });
  }

  // Org cost items
  function addOrgItem() {
    const newItem: OrgCostItem = {
      id: crypto.randomUUID(),
      title: "",
      type: "percent",
      value: 0,
    };
    update({ orgCostItems: [...section.orgCostItems, newItem] });
  }
  function setOrgItem(index: number, value: OrgCostItem) {
    const updated = [...section.orgCostItems];
    updated[index] = value;
    update({ orgCostItems: updated });
  }
  function removeOrgItem(index: number) {
    update({ orgCostItems: section.orgCostItems.filter((_, i) => i !== index) });
  }

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Название раздела"
          className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm font-medium"
          value={section.sectionName}
          onChange={(e) => update({ sectionName: e.target.value })}
        />
        <span
          className={`text-xs px-2 py-1 rounded border flex-shrink-0 ${SECTION_TYPE_COLORS[section.sectionType]}`}
        >
          {SECTION_TYPE_LABELS[section.sectionType]}
        </span>
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none flex-shrink-0"
            title="Удалить раздел"
          >
            ×
          </button>
        )}
      </div>

      {/* Standard: catalog + manual works */}
      {section.sectionType === "standard" && (
        <>
          {section.catalogItems.map((input, i) => (
            <WorkRow
              key={i}
              input={input}
              categories={catalog.works}
              onChange={(v) => setCatalogItem(i, v)}
              onRemove={() => removeCatalogItem(i)}
            />
          ))}
          {section.manualItems.map((line, i) => (
            <ManualLineRow
              key={line.id}
              line={line}
              titlePlaceholder="Наименование работы"
              onChange={(v) => setManualItem(i, v)}
              onRemove={() => removeManualItem(i)}
            />
          ))}
          <div className="flex gap-2">
            <button
              onClick={addCatalogItem}
              className="flex-1 border-2 border-dashed border-gray-300 rounded-lg py-2 text-xs text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors"
            >
              + Из каталога
            </button>
            <button
              onClick={addManualItem}
              className="flex-1 border-2 border-dashed border-amber-300 rounded-lg py-2 text-xs text-amber-600 hover:border-amber-400 hover:text-amber-700 transition-colors"
            >
              + Ручная строка
            </button>
          </div>

          {/* Materials sub-block */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Материалы
            </p>
            {section.materials.map((m, i) => (
              <MaterialRow
                key={m.id}
                material={m}
                presets={catalog.materials}
                onChange={(v) => setMaterial(i, v)}
                onRemove={() => removeMaterial(i)}
              />
            ))}
            <button
              onClick={addMaterial}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              + Материал
            </button>
          </div>
        </>
      )}

      {/* Extra costs */}
      {section.sectionType === "extra_costs" && (
        <>
          {section.extraItems.map((cost, i) => (
            <ExtraCostRow
              key={cost.id}
              cost={cost}
              suggestions={extraSuggestions}
              onChange={(v) => setExtraItem(i, v)}
              onRemove={() => removeExtraItem(i)}
            />
          ))}
          <button
            onClick={addExtraItem}
            className="w-full border-2 border-dashed border-orange-300 rounded-lg py-2 text-xs text-orange-600 hover:border-orange-400 hover:text-orange-700 transition-colors"
          >
            + Добавить расход
          </button>
        </>
      )}

      {/* Org costs */}
      {section.sectionType === "org_costs" && (
        <>
          <p className="text-xs text-gray-400">
            % начисляется от суммы всех стандартных разделов (работы + материалы)
          </p>
          {section.orgCostItems.map((item, i) => (
            <OrgCostRow
              key={item.id}
              item={item}
              onChange={(v) => setOrgItem(i, v)}
              onRemove={() => removeOrgItem(i)}
            />
          ))}
          <button
            onClick={addOrgItem}
            className="w-full border-2 border-dashed border-purple-300 rounded-lg py-2 text-xs text-purple-600 hover:border-purple-400 hover:text-purple-700 transition-colors"
          >
            + Добавить статью
          </button>
        </>
      )}

      {/* Section note */}
      <div className="border-t border-gray-100 pt-2">
        <input
          type="text"
          placeholder="Примечание к разделу (необязательно)"
          className="w-full border border-gray-200 rounded px-3 py-1.5 text-xs text-gray-500"
          value={section.note ?? ""}
          onChange={(e) => update({ note: e.target.value })}
        />
      </div>
    </div>
  );
}
