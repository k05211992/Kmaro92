"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, ShoppingCart, Phone, Menu } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useQuote } from "@/context/QuoteContext";
import { ModeToggle } from "./ModeToggle";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function Header() {
  const pathname = usePathname();
  const { toggleQuotePanel, isCatalogLoaded } = useApp();
  const { getItemCount } = useQuote();
  const itemCount = getItemCount();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Главная" },
    { href: "/catalog", label: "Каталог" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white lg:bg-[#21b65d] shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 bg-[#21b65d] lg:bg-white/20 rounded-xl flex items-center justify-center">
              <Leaf className="text-white" size={18} />
            </div>
            <span className="font-bold text-gray-900 lg:text-white text-base tracking-tight hidden sm:block">
              Питомник
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold tracking-wide uppercase transition-colors duration-200",
                  pathname === href
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:text-white hover:bg-white/15"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Phone — desktop */}
            <a
              href="tel:+70000000000"
              className="hidden lg:flex items-center gap-2 text-white/90 hover:text-white text-sm font-semibold transition-colors mr-2"
            >
              <Phone size={15} />
              +7 (000) 000-00-00
            </a>

            {/* Phone icon — mobile */}
            <a
              href="tel:+70000000000"
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Phone size={17} />
            </a>

            <ModeToggle />

            {/* Cart / Подборка */}
            {isCatalogLoaded && (
              <button
                onClick={toggleQuotePanel}
                className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200
                  bg-[#21b65d] text-white hover:bg-[#198b47]
                  lg:bg-white lg:text-[#21b65d] lg:hover:bg-white/90"
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

            {/* Burger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "px-4 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide transition-colors",
                  pathname === href
                    ? "bg-[#e8f9ef] text-[#21b65d]"
                    : "text-gray-700 hover:bg-gray-50"
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
