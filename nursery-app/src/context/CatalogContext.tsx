"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import type { CatalogFilters, Plant } from "@/types";
import { DEFAULT_FILTERS } from "@/types";
import { useApp } from "./AppContext";

interface CatalogContextValue {
  filters: CatalogFilters;
  setFilters: (filters: CatalogFilters) => void;
  updateFilter: <K extends keyof CatalogFilters>(
    key: K,
    value: CatalogFilters[K]
  ) => void;
  resetFilters: () => void;
  filteredPlants: Plant[];
  categories: string[]; // unique categories from loaded plants
  // Selected plant for detail modal
  selectedPlant: Plant | null;
  setSelectedPlant: (plant: Plant | null) => void;
  // View mode
  viewMode: "grid" | "table";
  setViewMode: (mode: "grid" | "table") => void;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const { plants } = useApp();
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_FILTERS);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const updateFilter = useCallback(
    <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  // Derive unique categories from plants
  const categories = useMemo(() => {
    const set = new Set<string>();
    plants.forEach((p) => set.add(p.category));
    return Array.from(set).sort();
  }, [plants]);

  // Apply filters to plants
  const filteredPlants = useMemo(() => {
    return plants.filter((plant) => {
      // Text search (name, latin_name, variety)
      if (filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        const haystack = [plant.name, plant.latin_name, plant.variety]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // Category filter
      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(plant.category)
      ) {
        return false;
      }

      // Light filter
      if (
        filters.light.length > 0 &&
        plant.light &&
        !filters.light.includes(plant.light)
      ) {
        return false;
      }

      // Moisture filter
      if (
        filters.moisture.length > 0 &&
        plant.moisture &&
        !filters.moisture.includes(plant.moisture)
      ) {
        return false;
      }

      // Height group filter
      if (
        filters.height_group.length > 0 &&
        plant.height_group &&
        !filters.height_group.includes(plant.height_group)
      ) {
        return false;
      }

      // Stock status filter
      if (
        filters.stock_status.length > 0 &&
        !filters.stock_status.includes(plant.stock_status)
      ) {
        return false;
      }

      // Frost zone filter (text match — e.g. "4" matches "4" or "4-5")
      if (filters.frost_zone.trim()) {
        const zone = filters.frost_zone.trim();
        if (!plant.frost_zone || !plant.frost_zone.includes(zone)) return false;
      }

      // Price range filter (use retail price as reference)
      // Guard against NaN from invalid text input
      const price = plant.price_retail;
      const minPrice = filters.price_min !== "" ? parseFloat(filters.price_min) : null;
      const maxPrice = filters.price_max !== "" ? parseFloat(filters.price_max) : null;
      if (minPrice !== null && !isNaN(minPrice) && price < minPrice) return false;
      if (maxPrice !== null && !isNaN(maxPrice) && price > maxPrice) return false;

      return true;
    });
  }, [plants, filters]);

  return (
    <CatalogContext.Provider
      value={{
        filters,
        setFilters,
        updateFilter,
        resetFilters,
        filteredPlants,
        categories,
        selectedPlant,
        setSelectedPlant,
        viewMode,
        setViewMode,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used inside CatalogProvider");
  return ctx;
}
