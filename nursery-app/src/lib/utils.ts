import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format number as currency (RUB) */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Pluralize Russian word for "позиция" */
export function pluralPositions(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 19) return "позиций";
  const last = n % 10;
  if (last === 1) return "позиция";
  if (last >= 2 && last <= 4) return "позиции";
  return "позиций";
}
