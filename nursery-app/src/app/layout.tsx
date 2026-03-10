import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { QuoteProvider } from "@/context/QuoteContext";
import { Header } from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Питомник растений — Каталог и КП",
  description:
    "Подбор растений, фильтрация по параметрам, формирование коммерческих предложений",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="h-full">
      <body className={`${inter.className} h-full`}>
        <AppProvider>
          <QuoteProvider>
            <Header />
            <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
          </QuoteProvider>
        </AppProvider>
      </body>
    </html>
  );
}
