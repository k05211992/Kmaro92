import { formatRub } from "@/lib/calc";
import type { Estimate } from "@/types";

interface Props {
  estimate: Estimate;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <tr>
      <td
        colSpan={5}
        className="pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400"
      >
        {title}
      </td>
    </tr>
  );
}

function SubtotalRow({
  label,
  amount,
  dimmed,
}: {
  label: string;
  amount: number;
  dimmed?: boolean;
}) {
  return (
    <tr className="border-t border-gray-100">
      <td
        colSpan={4}
        className={`py-1.5 text-right text-sm ${dimmed ? "text-gray-400" : "text-gray-500"}`}
      >
        {label}
      </td>
      <td
        className={`py-1.5 text-right text-sm font-medium tabular-nums ${
          dimmed ? "text-gray-400" : "text-gray-700"
        }`}
      >
        {formatRub(amount)}
      </td>
    </tr>
  );
}

function SummaryRow({
  label,
  amount,
  color = "gray",
  bold,
}: {
  label: string;
  amount: number;
  color?: "gray" | "green" | "red" | "orange" | "blue";
  bold?: boolean;
}) {
  const colorMap = {
    gray: "text-gray-700",
    green: "text-green-700",
    red: "text-red-600",
    orange: "text-orange-600",
    blue: "text-blue-600",
  };
  return (
    <tr>
      <td
        colSpan={4}
        className={`py-1 text-right text-sm ${bold ? "font-semibold" : ""} ${colorMap[color]}`}
      >
        {label}
      </td>
      <td
        className={`py-1 text-right text-sm tabular-nums ${
          bold ? "font-semibold" : ""
        } ${colorMap[color]}`}
      >
        {formatRub(amount)}
      </td>
    </tr>
  );
}

export default function EstimateTable({ estimate }: Props) {
  const { summary } = estimate;
  const hasWorks = estimate.lines.length > 0;
  const hasManualWorks = estimate.manualWorks.length > 0;
  const hasMaterials = estimate.materials.length > 0;
  const hasExtra = estimate.extraCosts.length > 0;
  const hasAnyContent = hasWorks || hasManualWorks || hasMaterials || hasExtra;
  const hasFinancials =
    summary.markupAmount > 0 ||
    summary.discountAmount > 0 ||
    summary.minimumApplied ||
    summary.prepaymentAmount > 0;

  if (!hasAnyContent) {
    return (
      <p className="text-gray-400 text-sm text-center py-8">
        Добавьте работы, материалы или расходы — смета появится здесь
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500 text-left">
            <th className="pb-2 font-medium">Наименование</th>
            <th className="pb-2 font-medium text-right">Кол-во</th>
            <th className="pb-2 font-medium text-right">Ед.</th>
            <th className="pb-2 font-medium text-right">Цена</th>
            <th className="pb-2 font-medium text-right">Сумма</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-50">
          {/* ─── Работы из каталога ──────────────────────────────── */}
          {(hasWorks || hasManualWorks) && (
            <SectionHeader title="Работы" />
          )}
          {hasWorks && estimate.lines.map((line, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="py-2 pr-4">
                <div className="font-medium text-gray-800">{line.categoryLabel}</div>
                <div className="text-xs text-gray-500">{line.variantLabel}</div>
              </td>
              <td className="py-2 text-right text-gray-700 tabular-nums">
                {line.quantity.toLocaleString("ru-RU")}
              </td>
              <td className="py-2 text-right text-gray-500">{line.unit}</td>
              <td className="py-2 text-right text-gray-700 tabular-nums">
                {formatRub(line.unitPrice)}
              </td>
              <td className="py-2 text-right font-medium text-gray-900 tabular-nums">
                {formatRub(line.subtotal)}
              </td>
            </tr>
          ))}

          {/* ─── Ручные работы ───────────────────────────────────── */}
          {hasManualWorks && estimate.manualWorks.map((m) => (
            <tr key={m.id} className="hover:bg-amber-50">
              <td className="py-2 pr-4">
                <div className="font-medium text-gray-800">
                  {m.title || <span className="text-gray-400 italic">Без названия</span>}
                </div>
                {m.comment && <div className="text-xs text-gray-500">{m.comment}</div>}
              </td>
              <td className="py-2 text-right text-gray-700 tabular-nums">
                {m.quantity.toLocaleString("ru-RU")}
              </td>
              <td className="py-2 text-right text-gray-500">{m.unit ?? "—"}</td>
              <td className="py-2 text-right text-gray-700 tabular-nums">
                {formatRub(m.price)}
              </td>
              <td className="py-2 text-right font-medium text-gray-900 tabular-nums">
                {formatRub(m.subtotal)}
              </td>
            </tr>
          ))}

          {(hasWorks || hasManualWorks) && (
            <SubtotalRow
              label={
                estimate.complexityCoeff > 1.0
                  ? `Итого работы (×${estimate.complexityCoeff.toFixed(2)}):`
                  : "Итого работы:"
              }
              amount={summary.worksTotal + summary.manualWorksSubtotal}
            />
          )}
          {estimate.complexityCoeff > 1.0 && hasWorks && (
            <tr>
              <td colSpan={4} className="pb-1 text-right text-xs text-orange-500">
                в т.ч. коэффициент сложности:
              </td>
              <td className="pb-1 text-right text-xs text-orange-500 tabular-nums">
                +{formatRub(summary.worksTotal - summary.worksSubtotal)}
              </td>
            </tr>
          )}

          {/* ─── Материалы ───────────────────────────────────────── */}
          {hasMaterials && (
            <>
              <SectionHeader title="Материалы" />
              {estimate.materials.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="py-2 pr-4">
                    <div className="font-medium text-gray-800">
                      {m.title || <span className="text-gray-400 italic">Без названия</span>}
                    </div>
                    {m.comment && <div className="text-xs text-gray-500">{m.comment}</div>}
                  </td>
                  <td className="py-2 text-right text-gray-700 tabular-nums">
                    {m.quantity.toLocaleString("ru-RU")}
                  </td>
                  <td className="py-2 text-right text-gray-500">{m.unit}</td>
                  <td className="py-2 text-right text-gray-700 tabular-nums">
                    {formatRub(m.price)}
                  </td>
                  <td className="py-2 text-right font-medium text-gray-900 tabular-nums">
                    {formatRub(m.subtotal)}
                  </td>
                </tr>
              ))}
              <SubtotalRow label="Итого материалы:" amount={summary.materialsSubtotal} />
            </>
          )}

          {/* ─── Дополнительные расходы ──────────────────────────── */}
          {hasExtra && (
            <>
              <SectionHeader title="Дополнительные расходы" />
              {estimate.extraCosts.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="py-2 pr-4" colSpan={4}>
                    <div className="font-medium text-gray-800">
                      {e.title || <span className="text-gray-400 italic">Без названия</span>}
                    </div>
                    {e.comment && <div className="text-xs text-gray-500">{e.comment}</div>}
                  </td>
                  <td className="py-2 text-right font-medium text-gray-900 tabular-nums">
                    {formatRub(e.amount)}
                  </td>
                </tr>
              ))}
              <SubtotalRow label="Итого расходы:" amount={summary.extraCostsTotal} />
            </>
          )}

          {/* ─── Финансовый итог ─────────────────────────────────── */}
          {hasAnyContent && (
            <>
              <SectionHeader title="Итоги" />
              <SummaryRow
                label="Базовый итог:"
                amount={summary.baseTotal}
                bold={!hasFinancials}
                color={hasFinancials ? "gray" : "green"}
              />

              {summary.markupAmount > 0 && (
                <SummaryRow
                  label={`Наценка (${estimate.financialTerms.markupType === "percent"
                    ? `${estimate.financialTerms.markupValue}%`
                    : "фикс."
                  }):`}
                  amount={summary.markupAmount}
                  color="orange"
                />
              )}

              {summary.markupAmount > 0 && (
                <SubtotalRow label="После наценки:" amount={summary.afterMarkup} dimmed />
              )}

              {summary.discountAmount > 0 && (
                <>
                  <SummaryRow
                    label={`Скидка (${estimate.financialTerms.discountType === "percent"
                      ? `${estimate.financialTerms.discountValue}%`
                      : "фикс."
                    }):`}
                    amount={-summary.discountAmount}
                    color="red"
                  />
                  <SubtotalRow label="После скидки:" amount={summary.adjustedTotal} dimmed />
                </>
              )}

              {summary.minimumApplied && (
                <tr>
                  <td colSpan={4} className="py-1 text-right text-xs text-blue-600">
                    Применён минимальный заказ ({formatRub(estimate.financialTerms.minimumOrderAmount)}):
                  </td>
                  <td className="py-1 text-right text-xs text-blue-600 tabular-nums">
                    +{formatRub(summary.finalTotal - summary.adjustedTotal)}
                  </td>
                </tr>
              )}
            </>
          )}
        </tbody>

        <tfoot>
          <tr className="border-t-2 border-gray-300">
            <td colSpan={4} className="pt-3 text-right font-bold text-gray-900 text-base">
              ИТОГО К ОПЛАТЕ:
            </td>
            <td className="pt-3 text-right font-bold text-green-700 text-base tabular-nums">
              {formatRub(summary.finalTotal)}
            </td>
          </tr>

          {summary.prepaymentAmount > 0 && (
            <>
              <tr>
                <td
                  colSpan={4}
                  className="pt-1.5 text-right text-sm text-blue-600"
                >
                  Предоплата ({estimate.financialTerms.prepaymentPercent}%):
                </td>
                <td className="pt-1.5 text-right text-sm font-medium text-blue-600 tabular-nums">
                  {formatRub(summary.prepaymentAmount)}
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="pt-1 text-right text-sm text-gray-600">
                  Остаток к оплате:
                </td>
                <td className="pt-1 text-right text-sm font-medium text-gray-700 tabular-nums">
                  {formatRub(summary.remainingAmount)}
                </td>
              </tr>
            </>
          )}
        </tfoot>
      </table>
    </div>
  );
}
