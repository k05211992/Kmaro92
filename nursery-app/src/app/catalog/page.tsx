"use client";

import { useState } from "react";
import { LayoutGrid, LayoutList, Upload, SlidersHorizontal, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { CatalogProvider, useCatalog } from "@/context/CatalogContext";
import { Filters } from "@/components/catalog/Filters";
import { PlantGrid } from "@/components/catalog/PlantGrid";
import { PlantModal } from "@/components/catalog/PlantModal";
import { SearchBar } from "@/components/catalog/SearchBar";
import { QuotePanel } from "@/components/quote/QuotePanel";
import { ExcelUpload } from "@/components/upload/ExcelUpload";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

// ---- Inner component that uses CatalogContext ----
function CatalogPageInner() {
  const { isCatalogLoaded, mode, isQuotePanelOpen, setQuotePanelOpen } = useApp();
  const { selectedPlant, setSelectedPlant, filteredPlants } = useCatalog();
  const [showUpload, setShowUpload] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Show upload prompt if catalog is empty
  if (!isCatalogLoaded) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Upload className="text-brand-400" size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Каталог не загружен
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          {mode === "manager"
            ? "Загрузите Excel-файл с каталогом растений, чтобы начать работу."
            : "Каталог ещё не загружен. Обратитесь к менеджеру."}
        </p>
        {mode === "manager" && (
          <>
            <Button variant="primary" size="lg" onClick={() => setShowUpload(true)}>
              <Upload size={18} />
              Загрузить каталог
            </Button>
            <Modal
              open={showUpload}
              onClose={() => setShowUpload(false)}
              title="Загрузить каталог растений"
              maxWidth="md"
            >
              <div className="p-6">
                <ExcelUpload onSuccess={() => setShowUpload(false)} />
              </div>
            </Modal>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ---- Left sidebar: filters (desktop) ---- */}
      <div className="hidden lg:block w-60 xl:w-64 flex-shrink-0 overflow-y-auto border-r border-gray-100 bg-white scrollbar-thin">
        <div className="p-4">
          <Filters />
        </div>
      </div>

      {/* ---- Main area ---- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0">
          {/* Mobile filter toggle */}
          <button
            className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            onClick={() => setShowMobileFilters(true)}
          >
            <SlidersHorizontal size={14} />
            Фильтры
          </button>

          {/* Search bar */}
          <SearchBar className="flex-1" />

          {/* Results count (md+) */}
          <span className="hidden md:block text-sm text-gray-400 flex-shrink-0">
            {filteredPlants.length} позиций
          </span>

          {/* Manager: upload button */}
          {mode === "manager" && (
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0"
              onClick={() => setShowUpload(true)}
            >
              <Upload size={14} />
              <span className="hidden sm:block">Обновить</span>
            </Button>
          )}
        </div>

        {/* Plant grid */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <PlantGrid />
        </div>
      </div>

      {/* ---- Right panel: Quote (desktop sticky) ---- */}
      <div
        className={cn(
          "flex-shrink-0 transition-all duration-300 overflow-hidden",
          "hidden md:block",
          isQuotePanelOpen ? "w-72 xl:w-80" : "w-0"
        )}
      >
        {isQuotePanelOpen && (
          <QuotePanel className="h-full overflow-hidden scrollbar-thin" />
        )}
      </div>

      {/* ---- Mobile Quote panel overlay ---- */}
      {isQuotePanelOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40"
            onClick={() => setQuotePanelOpen(false)}
          />
          <div className="w-80 max-w-[90vw] bg-white h-full overflow-hidden shadow-xl">
            <QuotePanel className="h-full" />
          </div>
        </div>
      )}

      {/* ---- Mobile filters overlay ---- */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="w-72 max-w-[85vw] bg-white h-full overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="font-semibold text-gray-800">Фильтры</span>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <Filters />
            </div>
          </div>
        </div>
      )}

      {/* ---- Plant detail modal ---- */}
      <PlantModal
        plant={selectedPlant}
        onClose={() => setSelectedPlant(null)}
      />

      {/* ---- Upload modal ---- */}
      <Modal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        title="Обновить каталог растений"
        maxWidth="md"
      >
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            Новые данные заменят текущий каталог. Подборка КП не изменится.
          </p>
          <ExcelUpload onSuccess={() => setShowUpload(false)} />
        </div>
      </Modal>
    </div>
  );
}

// ---- Page with providers ----
export default function CatalogPage() {
  return (
    <CatalogProvider>
      <CatalogPageInner />
    </CatalogProvider>
  );
}
