import { formatRub } from "@/lib/calc";
import type { Estimate, ProjectMeta } from "@/types";

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

function TableHeader({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="bg-gray-100 text-left">
        {cols.map((col, i) => (
          <th
            key={i}
            className={`py-1.5 px-2 text-xs font-semibold text-gray-600 border border-gray-300 ${
              i > 0 ? "text-right" : ""
            }`}
          >
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function TotalRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <tr className={highlight ? "bg-gray-50" : ""}>
      <td
        colSpan={4}
        className="py-1 px-2 text-right text-xs text-gray-600 border-x border-gray-300"
      >
        {label}
      </td>
      <td
        className={`py-1 px-2 text-right text-xs font-semibold border border-gray-300 ${
          highlight ? "text-gray-900" : "text-gray-700"
        }`}
      >
        {value}
      </td>
    </tr>
  );
}

export default function PrintDoc({ estimate, meta, settings }: Props) {
  const { summary, financialTerms } = estimate;
  const hasWorks = estimate.lines.length > 0 || estimate.manualWorks.length > 0;
  const hasMaterials = estimate.materials.length > 0;
  const hasExtra = estimate.extraCosts.length > 0;

  const hasMarkup = settings.showFinancialDetails && summary.markupAmount > 0;
  const hasDiscount = settings.showFinancialDetails && summary.discountAmount > 0;
  const showPrepayment = summary.prepaymentAmount > 0;

  return (
    <div className="print-doc font-sans text-gray-900 text-sm leading-relaxed">
      {/* ─── Шапка ─────────────────────────────────────────────── */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-800">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-wide">
            Коммерческое предложение
          </h1>
          <div className="text-xs text-gray-500 mt-0.5">смета на ландшафтные работы</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm font-semibold">
            № {settings.estimateNumber}
          </div>
          <div className="text-xs text-gray-500">
            {formatDate(estimate.createdAt)}
          </div>
        </div>
      </div>

      {/* ─── Инфо о проекте ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
        <div>
          <div className="font-semibold text-gray-500 uppercase tracking-wide mb-1 text-[10px]">
            Клиент
          </div>
          <div className="space-y-0.5">
            {meta.clientName && (
              <div className="font-semibold text-sm">{meta.clientName}</div>
            )}
            {meta.phone && <div className="text-gray-600">{meta.phone}</div>}
            {meta.address && <div className="text-gray-600">{meta.address}</div>}
          </div>
        </div>
        <div>
          <div className="font-semibold text-gray-500 uppercase tracking-wide mb-1 text-[10px]">
            Объект
          </div>
          <div className="space-y-0.5">
            {meta.address && (
              <div className="text-gray-800">{meta.address}</div>
            )}
            {meta.note && settings.showComments && (
              <div className="text-gray-500 italic">{meta.note}</div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Раздел: Работы ─────────────────────────────────────── */}
      {hasWorks && (
        <div className="mb-5 break-inside-avoid-page">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
            Работы
          </h2>
          <table className="w-full border-collapse text-xs">
            <TableHeader cols={["Наименование", "Кол-во", "Ед.", "Цена, ₽", "Сумма, ₽"]} />
            <tbody>
              {estimate.lines.map((line, i) => (
                <tr key={i} className="even:bg-gray-50">
                  <td className="py-1.5 px-2 border border-gray-300">
                    <div className="font-medium">{line.categoryLabel}</div>
                    <div className="text-gray-500">{line.variantLabel}</div>
                  </td>
                  <td className="py-1.5 px-2 text-right border border-gray-300 tabular-nums">
                    {line.quantity.toLocaleString("ru-RU")}
                  </td>
                  <td className="py-1.5 px-2 text-right border border-gray-300">
                    {line.unit}
                  </td>
                  <td className="py-1.5 px-2 text-right border border-gray-300 tabular-nums">
                    {line.unitPrice.toLocaleString("ru-RU")}
                  </td>
                  <td className="py-1.5 px-2 text-right border border-gray-300 font-medium tabular-nums">
                    {line.subtotal.toLocaleString("ru-RU")}
                  </td>
                </tr>
              ))}

              {estimate.manualWorks.map((m) => (
                <tr key={m.id} className="even:bg-gray-50">
                  <td className="py-1.5 px-2 border border-gray-300">
                    <div className="font-medium">
                      {m.title || <span className="text-gray-400 italic">—</span>}
                    </div>
                    {m.comment && settings.showComments && (
                      <div className="text-gray-500">{m.comment}</div>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-right border border-gray-300 tabular-nums">
                    {m.quantity.toLocaleString("ru-RU")}
                  </td>
                  <td className="py-1.5 px-2 text-right border border-gray-300">
                    {m.unit ?? "—"}
                  </td>
                  <td className="py-1.5 px-2 text-right border border-gray-300 tabular-nums">
                    {m.price.toLocaleString("ru-RU")}
                  </td>
                  <td className="py-1.5 px-2 text-right border border-gray-300 font-medium tabular-nums">
                    {m.subtotal.toLocaleString("ru-RU")}
                  </td>
                </tr>
              ))}

              <TotalRow
                label={
                  estimate.complexityCoeff > 1.0
                    ? `Итого работы (коэф. ×${estimate.complexityCoeff.toFixed(2)}):`
                    : "Итого работы:"
                }
                value={formatRub(summary.worksTotal + summary.manualWorksSubtotal)}
              />
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Раздел: Материалы ──────────────────────────────────── */}
      {hasMaterials && (
        <div className="mb-5 break-inside-avoid-page">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
            Материалы
          </h2>
          <table className="w-full border-collapse text-xs">
            <TableHeader cols={["Наименование", "Кол-во", "Ед.", "Цена, ₽", "Сумма, ₽"]} />
            <tbody>
              {estimate.materials.map((m) => (
                <tr key={m.id} className="even:bg-gray-50">
                  <td className="py-1.5 px-2 border border-gray-300">
                    <div className="font-medium">
                      {m.title || <span className="text-gray-400 italic">—</span>}
                    </div>
                    {m.comment && settings.showComments && (
                      <div className="text-gray-500">{m.comment}</div>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-right border border-gray-300 tabular-nums">
                    {m.quantity.toLocaleString("ru-RU")}
                  </td>
                  <td className="py-1.5 px-2 text-right border border-gray-300">
                    {m.unit}
                  </td>
                  <td className="py-1.5 px-2 text-right border border-gray-300 tabular-nums">
                    {m.price.toLocaleString("ru-RU")}
                  </td>
                  <td className="py-1.5 px-2 text-right border border-gray-300 font-medium tabular-nums">
                    {m.subtotal.toLocaleString("ru-RU")}
                  </td>
                </tr>
              ))}
              <TotalRow label="Итого материалы:" value={formatRub(summary.materialsSubtotal)} />
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Раздел: Доп. расходы ───────────────────────────────── */}
      {hasExtra && (
        <div className="mb-5 break-inside-avoid-page">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
            Дополнительные расходы
          </h2>
          <table className="w-full border-collapse text-xs">
            <TableHeader cols={["Наименование", "", "", "", "Сумма, ₽"]} />
            <tbody>
              {estimate.extraCosts.map((e) => (
                <tr key={e.id} className="even:bg-gray-50">
                  <td className="py-1.5 px-2 border border-gray-300" colSpan={4}>
                    <div className="font-medium">
                      {e.title || <span className="text-gray-400 italic">—</span>}
                    </div>
                    {e.comment && settings.showComments && (
                      <div className="text-gray-500">{e.comment}</div>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-right border border-gray-300 font-medium tabular-nums">
                    {e.amount.toLocaleString("ru-RU")}
                  </td>
                </tr>
              ))}
              <TotalRow label="Итого расходы:" value={formatRub(summary.extraCostsTotal)} />
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Финансовый итог ────────────────────────────────────── */}
      <div className="break-inside-avoid-page">
        <table className="w-full border-collapse text-xs ml-auto max-w-xs">
          <tbody>
            {(hasMarkup || hasDiscount) && (
              <tr>
                <td
                  colSpan={4}
                  className="py-1 px-2 text-right text-gray-500 border-x border-t border-gray-300"
                >
                  Базовый итог:
                </td>
                <td className="py-1 px-2 text-right text-gray-700 font-medium tabular-nums border border-gray-300">
                  {formatRub(summary.baseTotal)}
                </td>
              </tr>
            )}

            {hasMarkup && (
              <tr>
                <td
                  colSpan={4}
                  className="py-1 px-2 text-right text-gray-500 border-x border-gray-300"
                >
                  Наценка (
                  {financialTerms.markupType === "percent"
                    ? `${financialTerms.markupValue}%`
                    : "фикс."}
                  ):
                </td>
                <td className="py-1 px-2 text-right tabular-nums border border-gray-300 text-orange-700 font-medium">
                  +{formatRub(summary.markupAmount)}
                </td>
              </tr>
            )}

            {hasDiscount && (
              <tr>
                <td
                  colSpan={4}
                  className="py-1 px-2 text-right text-gray-500 border-x border-gray-300"
                >
                  Скидка (
                  {financialTerms.discountType === "percent"
                    ? `${financialTerms.discountValue}%`
                    : "фикс."}
                  ):
                </td>
                <td className="py-1 px-2 text-right tabular-nums border border-gray-300 text-red-600 font-medium">
                  −{formatRub(summary.discountAmount)}
                </td>
              </tr>
            )}

            {summary.minimumApplied && settings.showFinancialDetails && (
              <tr>
                <td
                  colSpan={4}
                  className="py-1 px-2 text-right text-gray-500 border-x border-gray-300"
                >
                  Мин. заказ ({formatRub(financialTerms.minimumOrderAmount)}):
                </td>
                <td className="py-1 px-2 text-right tabular-nums border border-gray-300 text-blue-600 font-medium">
                  применён
                </td>
              </tr>
            )}

            {/* Итого к оплате */}
            <tr className="bg-gray-800 text-white">
              <td
                colSpan={4}
                className="py-2 px-2 text-right font-bold text-sm border border-gray-800"
              >
                ИТОГО К ОПЛАТЕ:
              </td>
              <td className="py-2 px-2 text-right font-bold text-sm tabular-nums border border-gray-800">
                {formatRub(summary.finalTotal)}
              </td>
            </tr>

            {showPrepayment && (
              <>
                <tr className="bg-blue-50">
                  <td
                    colSpan={4}
                    className="py-1.5 px-2 text-right text-blue-700 border-x border-gray-300"
                  >
                    Предоплата ({financialTerms.prepaymentPercent}%):
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums font-semibold text-blue-700 border border-gray-300">
                    {formatRub(summary.prepaymentAmount)}
                  </td>
                </tr>
                <tr>
                  <td
                    colSpan={4}
                    className="py-1.5 px-2 text-right text-gray-600 border-x border-b border-gray-300"
                  >
                    Остаток к оплате:
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums font-semibold text-gray-700 border border-gray-300">
                    {formatRub(summary.remainingAmount)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Подписи ────────────────────────────────────────────── */}
      <div className="mt-10 grid grid-cols-2 gap-8 text-xs text-gray-600">
        <div>
          <div className="border-b border-gray-400 mb-1 h-8" />
          <div>Исполнитель / подпись / дата</div>
        </div>
        <div>
          <div className="border-b border-gray-400 mb-1 h-8" />
          <div>Заказчик / подпись / дата</div>
        </div>
      </div>

      {/* ─── Дисклеймер ─────────────────────────────────────────── */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-[10px] text-gray-400 leading-snug">
        * Смета является предварительной и может быть изменена. Цены действительны в течение 30 дней
        с даты составления. Точная стоимость определяется после выезда на объект и согласования
        технического задания.
      </div>
    </div>
  );
}
