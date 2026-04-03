import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { QuoteProvider } from "@/context/QuoteContext";
import { Header } from "@/components/layout/Header";

const montserrat = Montserrat({ subsets: ["latin", "cyrillic"], variable: "--font-montserrat" });

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
      <body className={`${montserrat.variable} font-sans h-full`}>
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
