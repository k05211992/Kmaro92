"use client";

import { Search, X } from "lucide-react";
import { useCatalog } from "@/context/CatalogContext";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className }: SearchBarProps) {
  const { filters, updateFilter } = useCatalog();

  return (
    <div className={cn("relative flex items-center", className)}>
      <Search
        size={16}
        className="absolute left-3 text-gray-400 pointer-events-none"
      />
      <input
        type="text"
        placeholder="Поиск по названию, латинскому имени, сорту..."
        value={filters.search}
        onChange={(e) => updateFilter("search", e.target.value)}
        className={cn(
          "w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white",
          "text-sm text-gray-900 placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
          "transition-shadow"
        )}
      />
      {filters.search && (
        <button
          onClick={() => updateFilter("search", "")}
          className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Очистить поиск"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
