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
  ChevronRight,
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
    title: "Подбор по фильтрам",
    desc: "Категория, освещение, влажность, высота, зона морозостойкости, наличие",
  },
  {
    icon: PackageCheck,
    title: "Актуальное наличие",
    desc: "Загружайте актуальный каталог из Excel — цены и остатки всегда свежие",
  },
  {
    icon: Search,
    title: "Быстрый поиск",
    desc: "Поиск по названию, латинскому имени и сорту мгновенно",
  },
  {
    icon: FileDown,
    title: "Выгрузка КП в Excel",
    desc: "Готовое коммерческое предложение с позициями, скидками и доставкой",
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
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Leaf className="text-white" size={32} />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
          Питомник растений
          <br />
          <span className="text-brand-600">Каталог и КП</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
          Подбирайте растения по параметрам, добавляйте в подборку и
          формируйте коммерческое предложение в один клик.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isCatalogLoaded ? (
            <Link href="/catalog">
              <Button variant="primary" size="lg">
                Перейти в каталог
                <ArrowRight size={18} />
              </Button>
            </Link>
          ) : (
            <>
              {mode === "manager" && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setUploadOpen(true)}
                >
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
            <Button
              variant="outline"
              size="lg"
              onClick={() => setUploadOpen(true)}
            >
              <Upload size={18} />
              Обновить каталог
            </Button>
          )}
        </div>

        {!isCatalogLoaded && mode === "client" && (
          <p className="text-sm text-gray-400 mt-3">
            Каталог пуст. Попросите менеджера загрузить файл с растениями.
          </p>
        )}
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="flex gap-4 p-5 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow"
          >
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon className="text-brand-600" size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
          Как это работает
        </h2>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          {[
            {
              step: "1",
              title: "Загрузите каталог",
              desc: "Менеджер загружает Excel-файл с растениями",
            },
            {
              step: "2",
              title: "Подберите растения",
              desc: "Фильтруйте по категории, условиям, наличию",
            },
            {
              step: "3",
              title: "Добавьте в КП",
              desc: "Укажите количество, скидку, доставку",
            },
            {
              step: "4",
              title: "Выгрузите Excel",
              desc: "Готовое КП скачается автоматически",
            },
          ].map(({ step, title, desc }, i, arr) => (
            <div key={step} className="flex-1 flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {step}
                </div>
                {i < arr.length - 1 && (
                  <div className="hidden sm:block w-px flex-1 bg-gray-100 my-2" />
                )}
              </div>
              <div className="pt-1">
                <p className="font-semibold text-gray-900 text-sm">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
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
