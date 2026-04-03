"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload, ArrowRight, Leaf } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ExcelUpload } from "@/components/upload/ExcelUpload";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { slug: "Хвойные",     label: "Хвойные",     desc: "Ели, сосны, туи, можжевельники" },
  { slug: "Деревья",     label: "Деревья",      desc: "Лиственные деревья для сада и парка" },
  { slug: "Кустарники",  label: "Кустарники",   desc: "Декоративные листопадные кустарники" },
  { slug: "Многолетники",label: "Многолетники", desc: "Травянистые и почвопокровные" },
  { slug: "Розы",        label: "Розы",         desc: "Парковые, плетистые, чайно-гибридные" },
  { slug: "Вьющиеся",   label: "Вьющиеся",     desc: "Клематисы, плющ, девичий виноград" },
];

const USP = [
  { num: "500+", label: "видов растений", sub: "хвойные, лиственные, многолетники" },
  { num: "2026", label: "актуальный прайс", sub: "Botanik, весна–лето" },
  { num: "1 мин", label: "на формирование КП", sub: "скачать Excel в один клик" },
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
    <div className="flex flex-col">

      {/* ═══════════════ HERO ═══════════════ */}
      <section
        className="relative min-h-[calc(100vh-72px)] flex items-center overflow-hidden"
        style={{ background: "linear-gradient(160deg, #051a0e 0%, #0c3520 40%, #072b18 100%)" }}
      >
        {/* texture overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 60% at 70% 40%, #21b65d 0%, transparent 65%)",
          }}
        />

        {/* decorative leaf bg */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 flex items-center justify-center opacity-5 pointer-events-none select-none">
          <Leaf size={600} className="text-white -rotate-12" />
        </div>

        <div className="relative z-10 w-full max-w-screen-xl mx-auto px-6 sm:px-10 py-20">
          <div className="max-w-2xl">
            {/* Main heading */}
            <h1 className="text-white font-bold leading-none mb-6 uppercase tracking-wide">
              <span className="block" style={{ fontSize: "clamp(3rem, 9vw, 7rem)" }}>
                Ботаник
              </span>
              <span className="block text-white/70 font-semibold" style={{ fontSize: "clamp(1rem, 2.5vw, 1.75rem)", letterSpacing: "0.15em" }}>
                Питомник растений
              </span>
              <span className="block font-medium normal-case tracking-normal mt-1" style={{ fontSize: "clamp(0.8rem, 1.5vw, 1rem)", color: "#21b65d" }}>
                на юге Ленинградской области
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-10 max-w-md">
              Подбирайте растения, формируйте подборку
              и&nbsp;выгружайте готовое коммерческое предложение в&nbsp;Excel.
            </p>

            {/* CTA */}
            <div className="flex flex-wrap gap-4">
              {isCatalogLoaded ? (
                <>
                  <Link href="/catalog">
                    <button className="group inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white text-sm uppercase tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-95"
                      style={{ background: "#21b65d" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#30da75")}
                      onMouseLeave={e => (e.currentTarget.style.background = "#21b65d")}
                    >
                      Открыть каталог
                      <ArrowRight size={16} />
                    </button>
                  </Link>
                  {mode === "manager" && (
                    <button
                      onClick={() => setUploadOpen(true)}
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white/80 text-sm uppercase tracking-wide border border-white/25 hover:border-white/60 hover:text-white transition-all duration-200"
                    >
                      <Upload size={15} />
                      Обновить прайс
                    </button>
                  )}
                </>
              ) : mode === "manager" ? (
                <button
                  onClick={() => setUploadOpen(true)}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white text-sm uppercase tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-95"
                  style={{ background: "#21b65d" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#30da75")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#21b65d")}
                >
                  <Upload size={15} />
                  Загрузить каталог Excel
                </button>
              ) : (
                <Link href="/catalog">
                  <button className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white text-sm uppercase tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-95"
                    style={{ background: "#21b65d" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#30da75")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#21b65d")}
                  >
                    Перейти в каталог
                    <ArrowRight size={16} />
                  </button>
                </Link>
              )}
            </div>

            {!isCatalogLoaded && mode === "client" && (
              <p className="text-white/35 text-sm mt-5">
                Каталог ещё не загружен. Попросите менеджера добавить файл.
              </p>
            )}
          </div>

          {/* USP stats */}
          <div className="mt-16 flex flex-col sm:flex-row gap-0 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            {USP.map(({ num, label, sub }) => (
              <div key={label} className="pl-0 sm:pl-8 first:pl-0 pr-8 py-4 sm:py-0">
                <div className="flex items-start gap-4">
                  <div className="w-1 h-full min-h-[2.5rem] rounded-full self-stretch" style={{ background: "#21b65d" }} />
                  <div>
                    <p className="text-white font-bold text-2xl leading-none">{num}</p>
                    <p className="text-white/80 text-sm font-semibold mt-0.5 uppercase tracking-wide">{label}</p>
                    <p className="text-white/40 text-xs mt-0.5">{sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ КАТЕГОРИИ ═══════════════ */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-screen-xl mx-auto">
          <div className="mb-10">
            <p className="text-[#21b65d] text-xs font-bold tracking-[0.25em] uppercase mb-2">
              Ассортимент
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 uppercase tracking-tight">
              Категории растений
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map(({ slug, label, desc }) => (
              <Link key={slug} href={`/catalog?category=${encodeURIComponent(slug)}`}>
                <div className="group border border-gray-100 rounded-2xl p-6 hover:border-[#21b65d] hover:shadow-md transition-all duration-200 cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "#e8f9ef" }}
                    >
                      <Leaf size={18} style={{ color: "#21b65d" }} />
                    </div>
                    <ArrowRight
                      size={18}
                      className="text-gray-300 group-hover:text-[#21b65d] group-hover:translate-x-1 transition-all duration-200"
                    />
                  </div>
                  <p className="font-bold text-gray-900 uppercase tracking-wide text-sm mb-1">{label}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA BANNER ═══════════════ */}
      <section
        className="relative overflow-hidden py-20 px-4"
        style={{ background: "linear-gradient(135deg, #051a0e 0%, #0c3520 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 80% at 100% 50%, #21b65d 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-[#21b65d] text-xs font-bold tracking-[0.25em] uppercase mb-3">
              Попробуйте прямо сейчас
            </p>
            <h2
              className="text-white font-bold uppercase tracking-wide leading-tight"
              style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}
            >
              Формируйте подборку
              <br />и скачивайте КП
            </h2>
          </div>
          <div className="flex-shrink-0">
            {isCatalogLoaded ? (
              <Link href="/catalog">
                <button
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white text-sm uppercase tracking-wide transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: "#21b65d" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#30da75")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#21b65d")}
                >
                  Открыть каталог
                  <ArrowRight size={16} />
                </button>
              </Link>
            ) : mode === "manager" ? (
              <button
                onClick={() => setUploadOpen(true)}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white text-sm uppercase tracking-wide transition-all duration-200 hover:scale-[1.02]"
                style={{ background: "#21b65d" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#30da75")}
                onMouseLeave={e => (e.currentTarget.style.background = "#21b65d")}
              >
                <Upload size={15} />
                Загрузить каталог
              </button>
            ) : (
              <Link href="/catalog">
                <button
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white text-sm uppercase tracking-wide transition-all duration-200 hover:scale-[1.02]"
                  style={{ background: "#21b65d" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#30da75")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#21b65d")}
                >
                  Перейти в каталог
                  <ArrowRight size={16} />
                </button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════ UPLOAD MODAL ═══════════════ */}
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
            <p className="text-xs text-gray-400 font-medium mb-1">Обязательные колонки:</p>
            <p className="text-xs text-gray-400 font-mono">name, category, price_retail</p>
            <p className="text-xs text-gray-400 mt-1">
              Скачайте{" "}
              <a href="/sample_catalog.xlsx" className="underline" style={{ color: "#21b65d" }} download>
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
