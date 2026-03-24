"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import UnitSelect from "@/components/UnitSelect";
import { getCatalog, saveCatalog, resetCatalog, exportCatalogJSON, getPriceSourceMap } from "@/lib/catalogStorage";
import type { PriceSourceMap, PriceSourceEntry } from "@/lib/catalogStorage";
import type {
  Catalog,
  CatalogCategory,
  CatalogVariant,
  CatalogMaterial,
  CatalogCoefficient,
  CatalogExtraCostPreset,
} from "@/types";

type TabId = "works" | "materials" | "coefficients" | "presets";

// ─── Вспомогательные компоненты ──────────────────────────────────────────────

function Badge({ active }: { active: boolean }) {
  return (
    <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full ${active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
      {active ? "Актив" : "Неактив"}
    </span>
  );
}

function ActionBtn({ onClick, label, color = "gray" }: { onClick: () => void; label: string; color?: "gray" | "red" | "blue" }) {
  const colors = { gray: "text-gray-500 hover:text-gray-800", red: "text-red-400 hover:text-red-600", blue: "text-blue-500 hover:text-blue-700" };
  return <button onClick={onClick} className={`text-xs ${colors[color]} transition-colors`}>{label}</button>;
}

function PriceSourceBadge({
  entry,
  currentPrice,
}: {
  entry: PriceSourceEntry | undefined;
  currentPrice: number;
}) {
  if (!entry) return <span className="text-xs text-gray-300">—</span>;
  const changed = currentPrice !== entry.seedPrice;
  if (changed) {
    const base = entry.type === "v2" ? "v2" : "v1";
    return (
      <span className="inline-block text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
        изм. / {base}
      </span>
    );
  }
  if (entry.type === "v2") {
    return (
      <span className="inline-block text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700" title={entry.id}>
        v2 · {entry.id}
      </span>
    );
  }
  return (
    <span className="inline-block text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
      v1 fallback
    </span>
  );
}

// ─── Вкладка: Работы ─────────────────────────────────────────────────────────

function WorksTab({ catalog, onUpdate, sourceMap }: { catalog: Catalog; onUpdate: (c: Catalog) => void; sourceMap: PriceSourceMap }) {
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [editVariantId, setEditVariantId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<CatalogVariant & { catId: string; catUnit: string }>>({});
  const [addingToCatId, setAddingToCatId] = useState<string | null>(null);
  const [newVariant, setNewVariant] = useState({ label: "", unitPrice: 0 });
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [catDraft, setCatDraft] = useState<Partial<CatalogCategory>>({});
  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState({ label: "", unit: "" });

  // Фильтрация категорий и вариантов
  const filteredCats = catalog.works
    .map((cat) => {
      const variants = cat.variants.filter((v) => {
        const matchSearch = !search || v.label.toLowerCase().includes(search.toLowerCase()) || cat.label.toLowerCase().includes(search.toLowerCase());
        const matchActive = filterActive === "all" || (filterActive === "active" ? v.active !== false : v.active === false);
        return matchSearch && matchActive;
      });
      return { ...cat, variants };
    })
    .filter((cat) => {
      if (filterActive === "active" && cat.active === false) return false;
      if (filterActive === "inactive" && cat.active !== false) return false;
      return cat.variants.length > 0 || !search;
    });

  function updateCatalog(updater: (cats: CatalogCategory[]) => CatalogCategory[]) {
    onUpdate({ ...catalog, works: updater(catalog.works) });
  }

  function toggleCatActive(catId: string) {
    updateCatalog((cats) => cats.map((c) => c.id === catId ? { ...c, active: c.active === false ? true : false } : c));
  }

  function toggleVariantActive(catId: string, varId: string) {
    updateCatalog((cats) => cats.map((c) => c.id !== catId ? c : {
      ...c, variants: c.variants.map((v) => v.id !== varId ? v : { ...v, active: v.active === false ? true : false }),
    }));
  }

  function deleteVariant(catId: string, varId: string) {
    updateCatalog((cats) => cats.map((c) => c.id !== catId ? c : { ...c, variants: c.variants.filter((v) => v.id !== varId) }));
  }

  function deleteCategory(catId: string) {
    updateCatalog((cats) => cats.filter((c) => c.id !== catId));
  }

  function startEditVariant(catId: string, v: CatalogVariant, catUnit: string) {
    setEditVariantId(v.id);
    setEditDraft({ ...v, catId, catUnit });
  }

  function saveVariant() {
    if (!editVariantId || !editDraft.catId) return;
    updateCatalog((cats) => cats.map((c) => c.id !== editDraft.catId ? c : {
      ...c,
      unit: editDraft.catUnit ?? c.unit,
      variants: c.variants.map((v) => v.id !== editVariantId ? v : {
        ...v, label: editDraft.label ?? v.label, unitPrice: editDraft.unitPrice ?? v.unitPrice,
      }),
    }));
    setEditVariantId(null);
  }

  function addVariant(catId: string) {
    if (!newVariant.label) return;
    updateCatalog((cats) => cats.map((c) => c.id !== catId ? c : {
      ...c, variants: [...c.variants, { id: crypto.randomUUID(), label: newVariant.label, unitPrice: newVariant.unitPrice, active: true }],
    }));
    setAddingToCatId(null);
    setNewVariant({ label: "", unitPrice: 0 });
  }

  function startEditCat(cat: CatalogCategory) {
    setEditCatId(cat.id);
    setCatDraft({ label: cat.label, unit: cat.unit });
  }

  function saveCat() {
    if (!editCatId) return;
    updateCatalog((cats) => cats.map((c) => c.id !== editCatId ? c : { ...c, ...catDraft }));
    setEditCatId(null);
  }

  function addCategory() {
    if (!newCat.label) return;
    const id = newCat.label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z_]/g, "") || crypto.randomUUID().slice(0, 8);
    updateCatalog((cats) => [...cats, { id, label: newCat.label, unit: newCat.unit || "шт", variants: [], active: true }]);
    setAddingCat(false);
    setNewCat({ label: "", unit: "" });
  }

  return (
    <div className="space-y-4">
      {/* Поиск и фильтр */}
      <div className="flex gap-3 items-center flex-wrap">
        <input type="text" placeholder="Поиск по названию..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-grow max-w-xs" />
        <div className="flex rounded overflow-hidden border border-gray-300 text-xs">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button key={f} onClick={() => setFilterActive(f)}
              className={`px-3 py-1.5 transition-colors ${filterActive === f ? "bg-gray-700 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              {f === "all" ? "Все" : f === "active" ? "Активные" : "Неактивные"}
            </button>
          ))}
        </div>
      </div>

      {/* Таблица по категориям */}
      {filteredCats.map((cat) => (
        <div key={cat.id} className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Заголовок категории */}
          <div className={`flex items-center gap-3 px-4 py-2 ${cat.active === false ? "bg-gray-100" : "bg-gray-50"}`}>
            {editCatId === cat.id ? (
              <>
                <input value={catDraft.label ?? ""} onChange={(e) => setCatDraft((d) => ({ ...d, label: e.target.value }))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm font-semibold flex-grow max-w-xs" autoFocus />
                <UnitSelect value={catDraft.unit ?? ""} onChange={(v) => setCatDraft((d) => ({ ...d, unit: v }))} />
                <ActionBtn onClick={saveCat} label="Сохранить" color="blue" />
                <ActionBtn onClick={() => setEditCatId(null)} label="Отмена" />
              </>
            ) : (
              <>
                <span className="font-semibold text-gray-800 flex-grow">{cat.label}</span>
                <span className="text-xs text-gray-400">ед.: {cat.unit}</span>
                <Badge active={cat.active !== false} />
                <ActionBtn onClick={() => startEditCat(cat)} label="Ред." color="blue" />
                <ActionBtn onClick={() => toggleCatActive(cat.id)} label={cat.active === false ? "Включить" : "Выкл."} />
                <ActionBtn onClick={() => deleteCategory(cat.id)} label="Удалить" color="red" />
              </>
            )}
          </div>

          {/* Варианты */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-gray-100 bg-white text-left text-xs text-gray-400">
                <th className="px-4 py-1.5 font-medium">Вариант</th>
                <th className="px-4 py-1.5 font-medium text-right">Цена, ₽</th>
                <th className="px-4 py-1.5 font-medium text-center">Статус</th>
                <th className="px-4 py-1.5 font-medium text-center">Источник</th>
                <th className="px-4 py-1.5 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cat.variants.map((v) =>
                editVariantId === v.id ? (
                  <tr key={v.id} className="bg-blue-50">
                    <td className="px-4 py-2">
                      <input value={editDraft.label ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, label: e.target.value }))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-full" autoFocus />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" min={0} value={editDraft.unitPrice ?? 0}
                        onChange={(e) => setEditDraft((d) => ({ ...d, unitPrice: parseFloat(e.target.value) || 0 }))}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-28 text-right" />
                    </td>
                    <td />
                    <td className="px-4 py-2 text-right">
                      <div className="flex gap-2 justify-end">
                        <ActionBtn onClick={saveVariant} label="Сохранить" color="blue" />
                        <ActionBtn onClick={() => setEditVariantId(null)} label="Отмена" />
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={v.id} className={`hover:bg-gray-50 ${v.active === false ? "opacity-50" : ""}`}>
                    <td className="px-4 py-2 text-gray-800">{v.label}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-700">{v.unitPrice.toLocaleString("ru-RU")} ₽</td>
                    <td className="px-4 py-2 text-center"><Badge active={v.active !== false} /></td>
                    <td className="px-4 py-2 text-center">
                      <PriceSourceBadge entry={sourceMap.works[`${cat.id}:${v.id}`]} currentPrice={v.unitPrice} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex gap-2 justify-end">
                        <ActionBtn onClick={() => startEditVariant(cat.id, v, cat.unit)} label="Ред." color="blue" />
                        <ActionBtn onClick={() => toggleVariantActive(cat.id, v.id)} label={v.active === false ? "Вкл." : "Выкл."} />
                        <ActionBtn onClick={() => deleteVariant(cat.id, v.id)} label="Удалить" color="red" />
                      </div>
                    </td>
                  </tr>
                )
              )}

              {/* Форма добавления варианта */}
              {addingToCatId === cat.id ? (
                <tr className="bg-green-50">
                  <td className="px-4 py-2">
                    <input placeholder="Название варианта" value={newVariant.label}
                      onChange={(e) => setNewVariant((d) => ({ ...d, label: e.target.value }))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-full" autoFocus />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min={0} placeholder="0" value={newVariant.unitPrice || ""}
                      onChange={(e) => setNewVariant((d) => ({ ...d, unitPrice: parseFloat(e.target.value) || 0 }))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-28 text-right" />
                  </td>
                  <td />
                  <td className="px-4 py-2 text-right">
                    <div className="flex gap-2 justify-end">
                      <ActionBtn onClick={() => addVariant(cat.id)} label="Добавить" color="blue" />
                      <ActionBtn onClick={() => { setAddingToCatId(null); setNewVariant({ label: "", unitPrice: 0 }); }} label="Отмена" />
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-1.5">
                    <button onClick={() => setAddingToCatId(cat.id)}
                      className="text-xs text-gray-400 hover:text-green-600 transition-colors">
                      + Добавить вариант
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ))}

      {/* Добавить категорию */}
      {addingCat ? (
        <div className="border border-green-300 bg-green-50 rounded-lg p-4 flex gap-3 items-center flex-wrap">
          <input placeholder="Название категории" value={newCat.label} onChange={(e) => setNewCat((d) => ({ ...d, label: e.target.value }))}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm flex-grow" autoFocus />
          <UnitSelect value={newCat.unit} onChange={(v) => setNewCat((d) => ({ ...d, unit: v }))} />
          <ActionBtn onClick={addCategory} label="Создать" color="blue" />
          <ActionBtn onClick={() => setAddingCat(false)} label="Отмена" />
        </div>
      ) : (
        <button onClick={() => setAddingCat(true)}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors">
          + Новая категория
        </button>
      )}
    </div>
  );
}

// ─── Вкладка: Материалы ──────────────────────────────────────────────────────

function MaterialsTab({ catalog, onUpdate, sourceMap }: { catalog: Catalog; onUpdate: (c: Catalog) => void; sourceMap: PriceSourceMap }) {
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<CatalogMaterial>>({});
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", unit: "шт", defaultPrice: 0 });

  function update(updater: (items: CatalogMaterial[]) => CatalogMaterial[]) {
    onUpdate({ ...catalog, materials: updater(catalog.materials) });
  }

  const filtered = catalog.materials.filter((m) => {
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase());
    const matchActive = filterActive === "all" || (filterActive === "active" ? m.active !== false : m.active === false);
    return matchSearch && matchActive;
  });

  function startEdit(m: CatalogMaterial) { setEditId(m.id); setEditDraft({ ...m }); }
  function save() {
    if (!editId) return;
    update((items) => items.map((m) => m.id !== editId ? m : { ...m, ...editDraft }));
    setEditId(null);
  }
  function toggle(id: string) { update((items) => items.map((m) => m.id !== id ? m : { ...m, active: m.active === false ? true : false })); }
  function remove(id: string) { update((items) => items.filter((m) => m.id !== id)); }
  function add() {
    if (!newItem.title) return;
    update((items) => [...items, { id: crypto.randomUUID(), ...newItem, active: true }]);
    setAdding(false);
    setNewItem({ title: "", unit: "шт", defaultPrice: 0 });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center flex-wrap">
        <input type="text" placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm flex-grow max-w-xs" />
        <div className="flex rounded overflow-hidden border border-gray-300 text-xs">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button key={f} onClick={() => setFilterActive(f)}
              className={`px-3 py-1.5 transition-colors ${filterActive === f ? "bg-gray-700 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
              {f === "all" ? "Все" : f === "active" ? "Активные" : "Неактивные"}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-400 text-left">
            <tr><th className="px-4 py-2 font-medium">Название</th><th className="px-4 py-2 font-medium">Ед.</th><th className="px-4 py-2 font-medium text-right">Цена, ₽</th><th className="px-4 py-2 font-medium text-center">Статус</th><th className="px-4 py-2 font-medium text-center">Источник</th><th className="px-4 py-2 font-medium text-right">Действия</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((m) => editId === m.id ? (
              <tr key={m.id} className="bg-blue-50">
                <td className="px-4 py-2"><input value={editDraft.title ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-full" autoFocus /></td>
                <td className="px-4 py-2"><UnitSelect value={editDraft.unit ?? ""} onChange={(v) => setEditDraft((d) => ({ ...d, unit: v }))} /></td>
                <td className="px-4 py-2"><input type="number" min={0} value={editDraft.defaultPrice ?? 0} onChange={(e) => setEditDraft((d) => ({ ...d, defaultPrice: parseFloat(e.target.value) || 0 }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-28 text-right" /></td>
                <td /><td className="px-4 py-2 text-right"><div className="flex gap-2 justify-end"><ActionBtn onClick={save} label="Сохранить" color="blue" /><ActionBtn onClick={() => setEditId(null)} label="Отмена" /></div></td>
              </tr>
            ) : (
              <tr key={m.id} className={`hover:bg-gray-50 ${m.active === false ? "opacity-50" : ""}`}>
                <td className="px-4 py-2 text-gray-800">{m.title}</td>
                <td className="px-4 py-2 text-gray-500">{m.unit}</td>
                <td className="px-4 py-2 text-right tabular-nums text-gray-700">{m.defaultPrice.toLocaleString("ru-RU")} ₽</td>
                <td className="px-4 py-2 text-center"><Badge active={m.active !== false} /></td>
                <td className="px-4 py-2 text-center">
                  <PriceSourceBadge entry={sourceMap.materials[m.id]} currentPrice={m.defaultPrice} />
                </td>
                <td className="px-4 py-2 text-right"><div className="flex gap-2 justify-end"><ActionBtn onClick={() => startEdit(m)} label="Ред." color="blue" /><ActionBtn onClick={() => toggle(m.id)} label={m.active === false ? "Вкл." : "Выкл."} /><ActionBtn onClick={() => remove(m.id)} label="Удалить" color="red" /></div></td>
              </tr>
            ))}

            {adding && (
              <tr className="bg-green-50">
                <td className="px-4 py-2"><input placeholder="Название" value={newItem.title} onChange={(e) => setNewItem((d) => ({ ...d, title: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-full" autoFocus /></td>
                <td className="px-4 py-2"><UnitSelect value={newItem.unit} onChange={(v) => setNewItem((d) => ({ ...d, unit: v }))} /></td>
                <td className="px-4 py-2"><input type="number" min={0} value={newItem.defaultPrice || ""} onChange={(e) => setNewItem((d) => ({ ...d, defaultPrice: parseFloat(e.target.value) || 0 }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-28 text-right" /></td>
                <td /><td className="px-4 py-2 text-right"><div className="flex gap-2 justify-end"><ActionBtn onClick={add} label="Добавить" color="blue" /><ActionBtn onClick={() => setAdding(false)} label="Отмена" /></div></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!adding && (
        <button onClick={() => setAdding(true)}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
          + Добавить материал
        </button>
      )}
    </div>
  );
}

// ─── Вкладка: Коэффициенты ───────────────────────────────────────────────────

function CoefficientsTab({ catalog, onUpdate }: { catalog: Catalog; onUpdate: (c: Catalog) => void }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<CatalogCoefficient>>({});

  function update(updater: (items: CatalogCoefficient[]) => CatalogCoefficient[]) {
    onUpdate({ ...catalog, coefficients: updater(catalog.coefficients) });
  }

  function save() {
    if (!editId) return;
    update((items) => items.map((c) => c.id !== editId ? c : { ...c, ...editDraft }));
    setEditId(null);
  }

  function num(v: number | string | undefined) { return typeof v === "number" ? v : parseFloat(String(v)) || 0; }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-400 text-left">
          <tr><th className="px-4 py-2 font-medium">Коэффициент</th><th className="px-4 py-2 font-medium text-right">По умолч.</th><th className="px-4 py-2 font-medium text-right">Мин.</th><th className="px-4 py-2 font-medium text-right">Макс.</th><th className="px-4 py-2 font-medium text-right">Действия</th></tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {catalog.coefficients.map((c) => editId === c.id ? (
            <tr key={c.id} className="bg-blue-50">
              <td className="px-4 py-2"><input value={editDraft.label ?? ""} onChange={(e) => setEditDraft((d) => ({ ...d, label: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-full" autoFocus /></td>
              <td className="px-4 py-2"><input type="number" step={0.05} value={editDraft.defaultValue ?? 0} onChange={(e) => setEditDraft((d) => ({ ...d, defaultValue: num(e.target.value) }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-20 text-right" /></td>
              <td className="px-4 py-2"><input type="number" step={0.05} value={editDraft.min ?? 0} onChange={(e) => setEditDraft((d) => ({ ...d, min: num(e.target.value) }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-20 text-right" /></td>
              <td className="px-4 py-2"><input type="number" step={0.05} value={editDraft.max ?? 0} onChange={(e) => setEditDraft((d) => ({ ...d, max: num(e.target.value) }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-20 text-right" /></td>
              <td className="px-4 py-2 text-right"><div className="flex gap-2 justify-end"><ActionBtn onClick={save} label="Сохранить" color="blue" /><ActionBtn onClick={() => setEditId(null)} label="Отмена" /></div></td>
            </tr>
          ) : (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-800">{c.label}</td>
              <td className="px-4 py-2 text-right tabular-nums text-gray-700">{c.defaultValue}</td>
              <td className="px-4 py-2 text-right tabular-nums text-gray-500">{c.min}</td>
              <td className="px-4 py-2 text-right tabular-nums text-gray-500">{c.max}</td>
              <td className="px-4 py-2 text-right"><ActionBtn onClick={() => { setEditId(c.id); setEditDraft({ ...c }); }} label="Редактировать" color="blue" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Вкладка: Пресеты расходов ───────────────────────────────────────────────

function PresetsTab({ catalog, onUpdate }: { catalog: Catalog; onUpdate: (c: Catalog) => void }) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  function update(updater: (items: CatalogExtraCostPreset[]) => CatalogExtraCostPreset[]) {
    onUpdate({ ...catalog, extraCostPresets: updater(catalog.extraCostPresets) });
  }

  function save() {
    if (!editId) return;
    update((items) => items.map((p) => p.id !== editId ? p : { ...p, title: editTitle }));
    setEditId(null);
  }

  function toggle(id: string) { update((items) => items.map((p) => p.id !== id ? p : { ...p, active: p.active === false ? true : false })); }
  function remove(id: string) { update((items) => items.filter((p) => p.id !== id)); }
  function add() {
    if (!newTitle.trim()) return;
    update((items) => [...items, { id: crypto.randomUUID(), title: newTitle.trim(), active: true }]);
    setAdding(false);
    setNewTitle("");
  }

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-400 text-left">
            <tr><th className="px-4 py-2 font-medium">Название пресета</th><th className="px-4 py-2 font-medium text-center">Статус</th><th className="px-4 py-2 font-medium text-right">Действия</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {catalog.extraCostPresets.map((p) => editId === p.id ? (
              <tr key={p.id} className="bg-blue-50">
                <td className="px-4 py-2" colSpan={2}><input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm w-full" autoFocus /></td>
                <td className="px-4 py-2 text-right"><div className="flex gap-2 justify-end"><ActionBtn onClick={save} label="Сохранить" color="blue" /><ActionBtn onClick={() => setEditId(null)} label="Отмена" /></div></td>
              </tr>
            ) : (
              <tr key={p.id} className={`hover:bg-gray-50 ${p.active === false ? "opacity-50" : ""}`}>
                <td className="px-4 py-2 text-gray-800">{p.title}</td>
                <td className="px-4 py-2 text-center"><Badge active={p.active !== false} /></td>
                <td className="px-4 py-2 text-right"><div className="flex gap-2 justify-end"><ActionBtn onClick={() => { setEditId(p.id); setEditTitle(p.title); }} label="Ред." color="blue" /><ActionBtn onClick={() => toggle(p.id)} label={p.active === false ? "Вкл." : "Выкл."} /><ActionBtn onClick={() => remove(p.id)} label="Удалить" color="red" /></div></td>
              </tr>
            ))}

            {adding && (
              <tr className="bg-green-50">
                <td className="px-4 py-2" colSpan={2}><input placeholder="Название расхода" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm w-full" autoFocus /></td>
                <td className="px-4 py-2 text-right"><div className="flex gap-2 justify-end"><ActionBtn onClick={add} label="Добавить" color="blue" /><ActionBtn onClick={() => setAdding(false)} label="Отмена" /></div></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!adding && (
        <button onClick={() => setAdding(true)}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-500 hover:border-orange-400 hover:text-orange-600 transition-colors">
          + Добавить пресет
        </button>
      )}
    </div>
  );
}

// ─── Главная страница каталога ────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: "works", label: "Работы" },
  { id: "materials", label: "Материалы" },
  { id: "coefficients", label: "Коэффициенты" },
  { id: "presets", label: "Пресеты расходов" },
];

export default function CatalogPage() {
  const [catalog, setCatalog] = useState<Catalog>(() =>
    typeof window !== "undefined" ? getCatalog() : { works: [], materials: [], coefficients: [], extraCostPresets: [] }
  );
  const [tab, setTab] = useState<TabId>("works");
  const importRef = useRef<HTMLInputElement>(null);
  const sourceMap = useMemo(() => getPriceSourceMap(), []);

  // После mount: подтянуть localStorage (аналогично главной странице)
  useEffect(() => {
    setCatalog(getCatalog());
  }, []);

  function update(updated: Catalog) {
    saveCatalog(updated);
    setCatalog(updated);
  }

  function handleReset() {
    if (confirm("Сбросить каталог к значениям по умолчанию? Все изменения будут потеряны.")) {
      setCatalog(resetCatalog());
    }
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target?.result as string) as Catalog;
        update(imported);
      } catch {
        alert("Ошибка чтения файла. Убедитесь, что это корректный JSON-каталог.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
              ← К смете
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Каталог и прайсы</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportCatalogJSON(catalog)}
              className="border border-gray-300 text-gray-600 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
              Экспорт JSON
            </button>
            <button onClick={() => importRef.current?.click()}
              className="border border-gray-300 text-gray-600 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
              Импорт JSON
            </button>
            <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <button onClick={handleReset}
              className="border border-red-300 text-red-600 text-sm px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
              Сброс
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Вкладки */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? "border-green-600 text-green-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Содержимое вкладок */}
        {tab === "works" && <WorksTab catalog={catalog} onUpdate={update} sourceMap={sourceMap} />}
        {tab === "materials" && <MaterialsTab catalog={catalog} onUpdate={update} sourceMap={sourceMap} />}
        {tab === "coefficients" && <CoefficientsTab catalog={catalog} onUpdate={update} />}
        {tab === "presets" && <PresetsTab catalog={catalog} onUpdate={update} />}
      </div>
    </div>
  );
}
