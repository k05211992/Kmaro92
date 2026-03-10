/**
 * Excel writer — generates КП (commercial proposal) Excel file
 * Uses SheetJS (xlsx). Runs client-side, triggers download.
 */
import * as XLSX from "xlsx";
import type { QuoteItem, QuoteClientInfo, DeliveryType, QuoteTotals } from "@/types";
import { getEffectivePrice, getLineTotal } from "@/context/QuoteContext";

const NURSERY_NAME = "Питомник растений";
const FIXED_DELIVERY = 1500; // default fixed delivery cost (MVP assumption)

interface GenerateQuoteExcelOptions {
  items: QuoteItem[];
  client_info: QuoteClientInfo;
  delivery_type: DeliveryType;
  delivery_cost: number;
  quote_number: string;
  created_at: Date;
  totals: QuoteTotals;
}

export function generateQuoteExcel(opts: GenerateQuoteExcelOptions): void {
  const { items, client_info, quote_number, created_at, totals, delivery_type, delivery_cost } = opts;

  const wb = XLSX.utils.book_new();

  // ---- Build rows for the sheet ----
  const rows: (string | number)[][] = [];

  // Header block
  rows.push([NURSERY_NAME]);
  rows.push([]);
  rows.push(["Коммерческое предложение"]);
  rows.push([`№ КП:`, quote_number]);
  rows.push([`Дата:`, formatDate(created_at)]);
  rows.push([]);

  // Client info
  rows.push(["Клиент"]);
  rows.push(["Имя:", client_info.name || "—"]);
  rows.push(["Телефон:", client_info.phone || "—"]);
  if (client_info.comment) {
    rows.push(["Комментарий:", client_info.comment]);
  }
  rows.push([]);

  // Table header
  const tableHeaderRow = [
    "№",
    "Категория",
    "Наименование",
    "Сорт / Вид",
    "Контейнер / Размер",
    "Тип цены",
    "Цена, руб.",
    "Кол-во",
    "Скидка, %",
    "Сумма, руб.",
  ];
  rows.push(tableHeaderRow);

  // Table rows
  items.forEach((item, idx) => {
    const price = getEffectivePrice(item);
    const lineTotal = getLineTotal(item);
    rows.push([
      idx + 1,
      item.plant.category,
      item.plant.name + (item.plant.latin_name ? ` (${item.plant.latin_name})` : ""),
      item.plant.variety || "—",
      [item.plant.container, item.plant.size].filter(Boolean).join(", ") || "—",
      item.price_type === "retail" ? "Розница" : "Опт",
      roundTo2(price),
      item.quantity,
      item.discount,
      roundTo2(lineTotal),
    ]);
  });

  rows.push([]);

  // Totals
  rows.push(["", "", "", "", "", "", "", "", "Сумма до скидки:", roundTo2(totals.subtotal)]);
  if (totals.discount_amount > 0) {
    rows.push(["", "", "", "", "", "", "", "", "Скидка:", roundTo2(totals.discount_amount)]);
    rows.push(["", "", "", "", "", "", "", "", "Итого со скидкой:", roundTo2(totals.subtotal_after_discount)]);
  }
  if (delivery_type !== "none" && totals.delivery > 0) {
    rows.push(["", "", "", "", "", "", "", "", "Доставка:", roundTo2(totals.delivery)]);
  }
  rows.push(["", "", "", "", "", "", "", "", "ИТОГО К ОПЛАТЕ:", roundTo2(totals.total)]);

  rows.push([]);

  // Notes
  rows.push(["Примечания:"]);
  rows.push([
    `— Цены действительны на дату формирования КП (${formatDate(created_at)}).`,
  ]);
  rows.push(["— Наличие растений требует подтверждения на момент заказа."]);
  rows.push([
    "— Стоимость доставки может уточняться в зависимости от объёма и адреса.",
  ]);
  rows.push([]);
  rows.push(["Спасибо за обращение в наш питомник!"]);

  // ---- Create worksheet ----
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths (approximate)
  ws["!cols"] = [
    { wch: 4 },   // №
    { wch: 16 },  // Категория
    { wch: 30 },  // Наименование
    { wch: 18 },  // Сорт
    { wch: 16 },  // Контейнер
    { wch: 10 },  // Тип цены
    { wch: 12 },  // Цена
    { wch: 8 },   // Кол-во
    { wch: 10 },  // Скидка
    { wch: 14 },  // Сумма
  ];

  XLSX.utils.book_append_sheet(wb, ws, "КП");

  // ---- Trigger download ----
  const fileName = `КП_${quote_number}_${formatDateFile(created_at)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ---- Helpers ----
function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateFile(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}
