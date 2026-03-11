"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, ShoppingCart } from "lucide-react";
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
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm">
            <Leaf className="text-white" size={18} />
          </div>
          <span className="font-bold text-gray-900 hidden sm:block tracking-tight">
            Питомник
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-0.5">
          <Link
            href="/"
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === "/"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            Главная
          </Link>
          <Link
            href="/catalog"
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === "/catalog"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            Каталог
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ModeToggle />

          {isCatalogLoaded && (
            <button
              onClick={toggleQuotePanel}
              className="relative flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
            >
              <ShoppingCart size={16} />
              <span className="hidden sm:block">Подборка</span>
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
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
