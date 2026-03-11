"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Leaf,
  SlidersHorizontal,
  PackageCheck,
  FileDown,
  Search,
  Upload,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ExcelUpload } from "@/components/upload/ExcelUpload";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

const FEATURES = [
  {
    icon: SlidersHorizontal,
    title: "Фильтрация по параметрам",
    desc: "Категория, освещение, влажность, высота, зона морозостойкости",
  },
  {
    icon: PackageCheck,
    title: "Актуальное наличие",
    desc: "Загружайте каталог из Excel — цены и остатки всегда свежие",
  },
  {
    icon: Search,
    title: "Мгновенный поиск",
    desc: "По названию, латинскому имени и сорту",
  },
  {
    icon: FileDown,
    title: "КП в один клик",
    desc: "Готовое коммерческое предложение с позициями и доставкой",
  },
];

export default function HomePage() {
  const { isCatalogLoaded, mode } = useApp();
  const [uploadOpen, setUploadOpen] = useState(false);
  const router = useRouter();

  const handleUploadSuccess = () => {
    setUploadOpen(false);
    router.push("/catalog");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-brand-100">
          <Leaf size={12} />
          Питомник растений
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-4 max-w-2xl">
          Каталог и{" "}
          <span className="text-brand-600">коммерческие предложения</span>
        </h1>

        <p className="text-lg text-gray-500 max-w-lg mx-auto mb-10">
          Подбирайте растения, формируйте подборку и выгружайте готовое КП в Excel за секунды.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isCatalogLoaded ? (
            <Link href="/catalog">
              <Button variant="primary" size="lg">
                Открыть каталог
                <ArrowRight size={18} />
              </Button>
            </Link>
          ) : (
            <>
              {mode === "manager" && (
                <Button variant="primary" size="lg" onClick={() => setUploadOpen(true)}>
                  <Upload size={18} />
                  Загрузить каталог Excel
                </Button>
              )}
              {mode === "client" && (
                <Link href="/catalog">
                  <Button variant="primary" size="lg">
                    Перейти в каталог
                    <ArrowRight size={18} />
                  </Button>
                </Link>
              )}
            </>
          )}

          {isCatalogLoaded && mode === "manager" && (
            <Button variant="outline" size="lg" onClick={() => setUploadOpen(true)}>
              <Upload size={18} />
              Обновить каталог
            </Button>
          )}
        </div>

        {!isCatalogLoaded && mode === "client" && (
          <p className="text-sm text-gray-400 mt-4">
            Каталог ещё не загружен. Попросите менеджера добавить файл.
          </p>
        )}
      </div>

      {/* Features strip */}
      <div className="border-t border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-start gap-3">
              <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center">
                <Icon className="text-brand-600" size={18} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm mb-1">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Загрузить каталог растений"
        maxWidth="md"
      >
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">
            Загрузите Excel-файл (.xlsx) с каталогом растений. Первая строка
            должна содержать заголовки колонок.
          </p>
          <ExcelUpload onSuccess={handleUploadSuccess} />
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-400 font-medium mb-1">
              Обязательные колонки:
            </p>
            <p className="text-xs text-gray-400 font-mono">
              name, category, price_retail
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Скачайте{" "}
              <a
                href="/sample_catalog.xlsx"
                className="text-brand-600 underline"
                download
              >
                пример файла
              </a>{" "}
              для справки.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
