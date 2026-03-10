"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { AppMode, Plant } from "@/types";

interface AppContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  // Global plant catalog loaded from Excel
  plants: Plant[];
  setPlants: (plants: Plant[]) => void;
  // Whether catalog has been loaded
  isCatalogLoaded: boolean;
  // Quote panel open state (for mobile/tablet toggle)
  isQuotePanelOpen: boolean;
  setQuotePanelOpen: (open: boolean) => void;
  toggleQuotePanel: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppMode>("client");
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isQuotePanelOpen, setQuotePanelOpen] = useState(false);

  // Auto-load prebuilt catalog on first mount
  useEffect(() => {
    fetch("/api/catalog/preload")
      .then((res) => res.json())
      .then((data) => {
        if (data.plants?.length) {
          setPlants(data.plants);
        }
      })
      .catch(() => {/* ignore: user can upload manually */});
  }, []);

  const toggleQuotePanel = useCallback(() => {
    setQuotePanelOpen((v) => !v);
  }, []);

  return (
    <AppContext.Provider
      value={{
        mode,
        setMode,
        plants,
        setPlants,
        isCatalogLoaded: plants.length > 0,
        isQuotePanelOpen,
        setQuotePanelOpen,
        toggleQuotePanel,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
