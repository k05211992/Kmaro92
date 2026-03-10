"use client";

import { User, Settings } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { AppMode } from "@/types";
import { cn } from "@/lib/utils";

export function ModeToggle() {
  const { mode, setMode } = useApp();

  return (
    <div className="flex items-center rounded-lg border border-gray-200 p-0.5 bg-gray-50">
      {(
        [
          { value: "client" as AppMode, label: "Клиент", icon: User },
          { value: "manager" as AppMode, label: "Менеджер", icon: Settings },
        ] as const
      ).map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setMode(value)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
            mode === value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Icon size={12} />
          <span className="hidden md:block">{label}</span>
        </button>
      ))}
    </div>
  );
}
