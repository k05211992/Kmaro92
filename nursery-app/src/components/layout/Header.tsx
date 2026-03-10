"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, ShoppingCart, Upload } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useQuote } from "@/context/QuoteContext";
import { ModeToggle } from "./ModeToggle";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const { toggleQuotePanel, isCatalogLoaded } = useApp();
  const { getItemCount } = useQuote();
  const itemCount = getItemCount();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Leaf className="text-white" size={16} />
          </div>
          <span className="font-bold text-gray-900 text-sm hidden sm:block">
            Питомник
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-colors",
              pathname === "/"
                ? "bg-brand-50 text-brand-700 font-medium"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            Главная
          </Link>
          <Link
            href="/catalog"
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-colors",
              pathname === "/catalog"
                ? "bg-brand-50 text-brand-700 font-medium"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            Каталог
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mode toggle */}
          <ModeToggle />

          {/* Quote button */}
          {isCatalogLoaded && (
            <button
              onClick={toggleQuotePanel}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              <ShoppingCart size={16} />
              <span className="hidden sm:block">КП</span>
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
