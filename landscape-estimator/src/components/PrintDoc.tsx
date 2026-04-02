import { formatRub } from "@/lib/calc";
import type {
  Estimate,
  EstimateSectionResult,
  ProjectMeta,
} from "@/types";

export interface PrintSettings {
  estimateNumber: string;
  showComments: boolean;
  showFinancialDetails: boolean;
}

interface Props {
  estimate: Estimate;
  meta: ProjectMeta;
  settings: PrintSettings;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Общие стили ─────────────────────────────────────────────────────────────
const TD  = "py-1 px-2 border border-gray-300 text-xs";
const TDR = `${TD} text-right tabular-nums`;
const TH  = "py-1.5 px-2 border border-gray-300 text-xs font-semibold bg-gray-100";
const THR = `${TH} text-right`;

// ─── Детальный раздел: Стандарт ──────────────────────────────────────────────
// Единая таблица: строки работ + строки материалов в одной таблице.
// Колонки: № | Наименование | Ед. | Кол-во | Цена, ₽ | Работы, ₽ | Материалы, ₽ | Примечание
function StandardSectionDetail({
  sec,
  showComments,
}: {
  sec: EstimateSectionResult;
  showComments: boolean;
}) {
  const hasWorks     = sec.lines.length > 0 || sec.manualItems.length > 0;
  const hasMaterials = sec.materials.length > 0;

  if (!hasWorks && !hasMaterials) return null;

  // Суммарный счётчик строк для нумерации
  let rowNum = 0;

  return (
    <div className="mb-5 break-inside-avoid-page">
      <table className="w-full border-collapse text-xs">
        <thead>
          {/* Заголовок раздела */}
          <tr className="bg-blue-50">
            <td colSpan={8} className={`${TD} font-bold text-blue-900 text-[11px]`}>
              {sec.sectionIndex}. {sec.sectionName || "Работы"}
            </td>
          </tr>
          {/* Шапка колонок */}
          <tr className="bg-gray-100">
            <th className={`${TH} w-7 text-center`}>№</th>
            <th className={`${TH} text-left`}>Наименование</th>
            <th className={`${TH} w-14 text-center`}>Ед.</th>
            <th className={`${THR} w-14`}>Кол-во</th>
            <th className={`${THR} w-20`}>Цена, ₽</th>
            <th className={`${THR} w-22`}>Работы, ₽</th>
            <th className={`${THR} w-22`}>Материалы, ₽</th>
            <th className={`${TH} w-24`}>Примечание</th>
          </tr>
        </thead>

        <tbody>
          {/* ── Строки работ из каталога ── */}
          {sec.lines.map((line) => {
            rowNum++;
            return (
              <tr key={`cat-${rowNum}`} className="even:bg-gray-50">
                <td className={`${TD} text-center`}>{rowNum}</td>
                <td className={TD}>
                  <div>{line.categoryLabel}</div>
                  <div className="text-gray-500 text-[10px]">{line.variantLabel}</div>
                </td>
                <td className={`${TD} text-center`}>{line.unit}</td>
                <td className={TDR}>{line.quantity.toLocaleString("ru-RU")}</td>
                <td className={TDR}>{line.unitPrice.toLocaleString("ru-RU")}</td>
                <td className={TDR}>{line.subtotal.toLocaleString("ru-RU")}</td>
                <td className={TD} />
                <td className={TD} />
              </tr>
            );
          })}

          {/* ── Ручные строки работ ── */}
          {sec.manualItems.map((m) => {
            rowNum++;
            return (
              <tr key={m.id} className="even:bg-amber-50">
                <td className={`${TD} text-center`}>{rowNum}</td>
                <td className={TD}>
                  <div>{m.title || <span className="text-gray-400 italic">—</span>}</div>
                  {m.comment && showComments && (
                    <div className="text-gray-500 text-[10px]">{m.comment}</div>
                  )}
                </td>
                <td className={`${TD} text-center`}>{m.unit ?? "—"}</td>
                <td className={TDR}>{m.quantity.toLocaleString("ru-RU")}</td>
                <td className={TDR}>{m.price.toLocaleString("ru-RU")}</td>
                <td className={TDR}>{m.subtotal.toLocaleString("ru-RU")}</td>
                <td className={TD} />
                <td className={TD} />
              </tr>
            );
          })}

          {/* ── Итого работы (если есть и работы, и материалы) ── */}
          {hasWorks && hasMaterials && (
            <tr className="bg-gray-50">
              <td colSpan={5} className={`${TD} text-right text-gray-500 italic`}>
                Итого работы:
              </td>
              <td className={`${TDR} text-gray-700`}>
                {formatRub(sec.worksTotal)}
              </td>
              <td className={TD} />
              <td className={TD} />
            </tr>
          )}

          {/* ── Строки материалов ── */}
          {hasMaterials && (
            <>
              {/* Подзаголовок материалов — только если есть и работы */}
              {hasWorks && (
                <tr className="bg-gray-100">
                  <td colSpan={8} className={`${TD} text-gray-500 text-[10px] font-semibold uppercase tracking-wide`}>
                    Материалы
                  </td>
                </tr>
              )}

              {sec.materials.map((m) => {
                rowNum++;
                return (
                  <tr key={m.id} className="even:bg-gray-50">
                    <td className={`${TD} text-center`}>{rowNum}</td>
                    <td className={TD}>
                      <div>{m.title || <span className="text-gray-400 italic">—</span>}</div>
                      {m.comment && showComments && (
                        <div className="text-gray-500 text-[10px]">{m.comment}</div>
                      )}
                    </td>
                    <td className={`${TD} text-center`}>{m.unit}</td>
                    <td className={TDR}>{m.quantity.toLocaleString("ru-RU")}</td>
                    <td className={TDR}>{m.price.toLocaleString("ru-RU")}</td>
                    <td className={TD} />
                    <td className={TDR}>{m.subtotal.toLocaleString("ru-RU")}</td>
                    <td className={TD} />
                  </tr>
                );
              })}
            </>
          )}

          {/* ── Итоговая строка раздела ── */}
          <tr className="bg-blue-50 font-semibold">
            <td colSpan={5} className={`${TD} text-right text-blue-800`}>
              {hasWorks && hasMaterials
                ? "ИТОГО по разделу:"
                : hasWorks
                ? "ИТОГО работы по разделу:"
                : "ИТОГО материалы по разделу:"}
            </td>
            <td className={`${TDR} text-blue-900 font-bold`}>
              {hasWorks ? formatRub(sec.worksTotal) : ""}
            </td>
            <td className={`${TDR} text-blue-900 font-bold`}>
              {hasMaterials ? formatRub(sec.materialsTotal) : ""}
            </td>
            <td className={TD} />
          </tr>

          {/* Общий итог раздела, если оба типа */}
          {hasWorks && hasMaterials && (
            <tr className="bg-blue-100 font-bold">
              <td colSpan={5} className={`${TD} text-right text-blue-900`}>
                ВСЕГО по разделу:
              </td>
              <td colSpan={2} className={`${TDR} text-blue-900 text-right`}>
                {formatRub(sec.sectionTotal)}
              </td>
              <td className={TD} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Детальный раздел: Доп. расходы (раздел 14) ──────────────────────────────
function ExtraCostsSectionDetail({
  sec,
  showComments,
}: {
  sec: EstimateSectionResult;
  showComments: boolean;
}) {
  if (sec.extraItems.length === 0) return null;

  return (
    <div className="mb-5 break-inside-avoid-page">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-amber-50">
            <td colSpan={4} className={`${TD} font-bold text-amber-900 text-[11px]`}>
              {sec.sectionIndex}. {sec.sectionName || "Дополнительные расходы"}{" "}
              <span className="font-normal text-amber-700">(по факту)</span>
            </td>
          </tr>
          <tr className="bg-gray-100">
            <th className={`${TH} w-7 text-center`}>№</th>
            <th className={`${TH} text-left`}>Наименование</th>
            <th className={`${TH} w-28`}>Примечание</th>
            <th className={`${THR} w-28`}>Сумма, ₽</th>
          </tr>
        </thead>
        <tbody>
          {sec.extraItems.map((e, i) => (
            <tr key={e.id} className="even:bg-gray-50">
              <td className={`${TD} text-center`}>{i + 1}</td>
              <td className={TD}>
                <div>{e.title || <span className="text-gray-400 italic">—</span>}</div>
                {e.comment && showComments && (
                  <div className="text-gray-500 text-[10px]">{e.comment}</div>
                )}
              </td>
              <td className={TD} />
              <td className={TDR}>{e.amount.toLocaleString("ru-RU")}</td>
            </tr>
          ))}
          <tr className="bg-amber-50 font-semibold">
            <td colSpan={3} className={`${TD} text-right text-amber-800`}>
              ИТОГО дополнительные расходы:
            </td>
            <td className={`${TDR} font-bold text-amber-900`}>
              {formatRub(sec.sectionTotal)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Детальный раздел: Орг. затраты (раздел 15) ──────────────────────────────
function OrgCostsSectionDetail({
  sec,
}: {
  sec: EstimateSectionResult;
}) {
  if (sec.orgCostResults.length === 0) return null;

  return (
    <div className="mb-5 break-inside-avoid-page">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-yellow-50">
            <td colSpan={4} className={`${TD} font-bold text-yellow-900 text-[11px]`}>
              {sec.sectionIndex}. {sec.sectionName || "Организационные затраты"}{" "}
              <span className="font-normal text-yellow-700">(предварительно)</span>
            </td>
          </tr>
          <tr className="bg-gray-100">
            <th className={`${TH} w-7 text-center`}>№</th>
            <th className={`${TH} text-left`}>Наименование</th>
            <th className={`${THR} w-16`}>%</th>
            <th className={`${THR} w-28`}>Стоимость, ₽</th>
          </tr>
        </thead>
        <tbody>
          {sec.orgCostResults.map((r, i) => (
            <tr key={r.item.id} className="even:bg-gray-50">
              <td className={`${TD} text-center`}>{i + 1}</td>
              <td className={TD}>
                <div>{r.item.title || <span className="text-gray-400 italic">—</span>}</div>
                {r.item.note && (
                  <div className="text-gray-500 text-[10px]">{r.item.note}</div>
                )}
              </td>
              <td className={TDR}>
                {r.item.type === "percent" ? `${r.item.value}%` : "—"}
              </td>
              <td className={TDR}>{formatRub(r.amount)}</td>
            </tr>
          ))}
          <tr className="bg-yellow-50 font-semibold">
            <td colSpan={3} className={`${TD} text-right text-yellow-800`}>
              ИТОГО организационные затраты:
            </td>
            <td className={`${TDR} font-bold text-yellow-900`}>
              {formatRub(sec.sectionTotal)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function PrintDoc({ estimate, meta, settings }: Props) {
  const { summary, financialTerms, sections } = estimate;
  const grandTotal = summary.finalTotal;
  const visibleSections = sections.filter((s) => s.sectionTotal > 0);

  return (
    <div className="print-doc font-sans text-gray-900 text-[11px] leading-relaxed">

      {/* ════════════════════════════════════════════════════════
          СТРАНИЦА 1 — СВОДНАЯ
      ════════════════════════════════════════════════════════ */}
      <div className="break-after-page">

        {/* ── Шапка: студия + дата ── */}
        <div className="flex justify-between items-start mb-5 pb-3 border-b-2 border-gray-800">
          <div>
            <div className="text-[15px] font-bold uppercase tracking-wide">
              Ландшафтная студия БОТАНИК
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              Бухарестская ул., д. 110, к. 1 · Санкт-Петербург
            </div>
          </div>
          <div className="text-right text-[10px] text-gray-500">
            <div>{formatDate(estimate.createdAt)}</div>
          </div>
        </div>

        {/* ── Заголовок документа ── */}
        <div className="text-center mb-5">
          <div className="text-[14px] font-bold uppercase tracking-widest text-gray-900">
            Коммерческое предложение
          </div>
          <div className="font-mono text-sm text-gray-600 mt-0.5">
            № {settings.estimateNumber || "__________"}
          </div>
        </div>

        {/* ── Реквизиты ── */}
        <table className="w-full border-collapse text-xs mb-5">
          <tbody>
            <tr>
              <td className="w-32 py-1 pr-3 text-gray-500 align-top font-medium">Заказчик:</td>
              <td className="py-1 border-b border-dotted border-gray-300 align-top">
                {meta.clientName || <span className="text-gray-400">—</span>}
                {meta.phone && <span className="text-gray-500 ml-2">{meta.phone}</span>}
              </td>
              <td className="w-8" />
              <td className="w-28 py-1 pr-3 text-gray-500 align-top font-medium">Исполнитель:</td>
              <td className="py-1 border-b border-dotted border-gray-300 align-top">
                Ландшафтная студия БОТАНИК
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-3 text-gray-500 align-top font-medium">Объект:</td>
              <td className="py-1 border-b border-dotted border-gray-300 align-top">
                {meta.address || <span className="text-gray-400">—</span>}
                {meta.note && settings.showComments && (
                  <div className="text-gray-500 italic text-[10px]">{meta.note}</div>
                )}
              </td>
              <td />
              <td className="py-1 pr-3 text-gray-500 align-top font-medium">Сроки работ:</td>
              <td className="py-1 border-b border-dotted border-gray-300" />
            </tr>
          </tbody>
        </table>

        {/* ── Сводная таблица разделов ── */}
        <div className="mb-1">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
            Сводная смета работ по благоустройству
          </div>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className={`${TH} w-8 text-center`}>№</th>
                <th className={`${TH} text-left`}>Наименование раздела</th>
                <th className={`${THR} w-36`}>Стоимость, ₽</th>
              </tr>
            </thead>
            <tbody>
              {visibleSections.map((sec) => (
                <tr key={sec.id} className="even:bg-gray-50">
                  <td className={`${TD} text-center`}>{sec.sectionIndex}</td>
                  <td className={TD}>{sec.sectionName || `Раздел ${sec.sectionIndex}`}</td>
                  <td className={TDR}>{formatRub(sec.sectionTotal)}</td>
                </tr>
              ))}

              {/* Разбивка работы/материалы если есть и те, и другие */}
              {summary.materialsSubtotal > 0 && (
                <>
                  <tr className="bg-gray-50">
                    <td colSpan={2} className={`${TD} text-right text-gray-500 text-[10px]`}>
                      в т.ч. работы:
                    </td>
                    <td className={`${TDR} text-gray-600 text-[10px]`}>
                      {formatRub(summary.worksTotal + summary.manualWorksSubtotal)}
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td colSpan={2} className={`${TD} text-right text-gray-500 text-[10px]`}>
                      в т.ч. материалы:
                    </td>
                    <td className={`${TDR} text-gray-600 text-[10px]`}>
                      {formatRub(summary.materialsSubtotal)}
                    </td>
                  </tr>
                </>
              )}

              {/* Наценка/скидка если showFinancialDetails */}
              {settings.showFinancialDetails && financialTerms.markupValue > 0 && (
                <tr>
                  <td colSpan={2} className={`${TD} text-right text-gray-500`}>
                    Наценка ({financialTerms.markupType === "percent"
                      ? `${financialTerms.markupValue}%`
                      : "фикс."}):
                  </td>
                  <td className={TDR}>{formatRub(summary.markupAmount)}</td>
                </tr>
              )}
              {settings.showFinancialDetails && financialTerms.discountValue > 0 && (
                <tr>
                  <td colSpan={2} className={`${TD} text-right text-gray-500`}>
                    Скидка ({financialTerms.discountType === "percent"
                      ? `${financialTerms.discountValue}%`
                      : "фикс."}):
                  </td>
                  <td className={`${TDR} text-red-600`}>−{formatRub(summary.discountAmount)}</td>
                </tr>
              )}

              {summary.minimumApplied && (
                <tr>
                  <td colSpan={2} className={`${TD} text-right text-gray-500`}>
                    Минимальный заказ ({formatRub(financialTerms.minimumOrderAmount)}):
                  </td>
                  <td className={`${TDR} text-blue-600`}>применён</td>
                </tr>
              )}

              {/* Итоговая строка */}
              <tr className="bg-gray-800 text-white">
                <td
                  colSpan={2}
                  className="py-2 px-2 border border-gray-800 text-right font-bold text-[12px]"
                >
                  ИТОГО К ОПЛАТЕ:
                </td>
                <td className="py-2 px-2 border border-gray-800 text-right font-bold text-[12px] tabular-nums">
                  {formatRub(grandTotal)}
                </td>
              </tr>

              {/* Предоплата */}
              {summary.prepaymentAmount > 0 && (
                <>
                  <tr className="bg-blue-50">
                    <td colSpan={2} className={`${TD} text-right text-blue-700`}>
                      Предоплата ({financialTerms.prepaymentPercent}%):
                    </td>
                    <td className={`${TDR} text-blue-700 font-semibold`}>
                      {formatRub(summary.prepaymentAmount)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className={`${TD} text-right text-gray-600`}>
                      Остаток к оплате:
                    </td>
                    <td className={`${TDR} font-semibold`}>
                      {formatRub(summary.remainingAmount)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Подписи ── */}
        <div className="mt-10 grid grid-cols-2 gap-12 text-xs text-gray-600">
          <div>
            <div className="border-b border-gray-400 mb-1 h-8" />
            <div>Исполнитель / подпись / дата</div>
          </div>
          <div>
            <div className="border-b border-gray-400 mb-1 h-8" />
            <div>Заказчик / подпись / дата</div>
          </div>
        </div>

        {/* ── Дисклеймер ── */}
        <div className="mt-6 pt-3 border-t border-gray-200 text-[10px] text-gray-400 leading-snug">
          * Коммерческое предложение является предварительным и может быть изменено.
          Цены действительны в течение 7 календарных дней с даты расчёта.
          Точная стоимость определяется после выезда на объект и согласования технического задания.
        </div>
      </div>

      {/* ── Визуальный разрыв страницы (только экран) ── */}
      <div className="no-print my-8 flex items-center gap-3">
        <div className="flex-1 border-t-2 border-dashed border-gray-300" />
        <span className="text-[10px] text-gray-400 uppercase tracking-widest">
          страница 2 — детальные разделы
        </span>
        <div className="flex-1 border-t-2 border-dashed border-gray-300" />
      </div>

      {/* ════════════════════════════════════════════════════════
          СТРАНИЦЫ 2+ — ДЕТАЛЬНЫЕ РАЗДЕЛЫ
      ════════════════════════════════════════════════════════ */}
      {sections.map((sec) => {
        if (sec.sectionType === "standard") {
          return (
            <StandardSectionDetail
              key={sec.id}
              sec={sec}
              showComments={settings.showComments}
            />
          );
        }
        if (sec.sectionType === "extra_costs") {
          return (
            <ExtraCostsSectionDetail
              key={sec.id}
              sec={sec}
              showComments={settings.showComments}
            />
          );
        }
        if (sec.sectionType === "org_costs" && settings.showFinancialDetails) {
          return (
            <OrgCostsSectionDetail
              key={sec.id}
              sec={sec}
            />
          );
        }
        return null;
      })}
    </div>
  );
}
