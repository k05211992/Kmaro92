import { cn } from "@/lib/utils";
import type { StockStatus } from "@/types";
import { STOCK_LABELS } from "@/types";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "green" | "yellow" | "red" | "gray" | "blue";
  className?: string;
}

export function Badge({ children, variant = "gray", className }: BadgeProps) {
  const variants = {
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Stock status badge with semantic color
const STOCK_VARIANTS: Record<StockStatus, BadgeProps["variant"]> = {
  in_stock: "green",
  low: "yellow",
  order: "blue",
  out: "red",
};

export function StockBadge({ status }: { status: StockStatus }) {
  return (
    <Badge variant={STOCK_VARIANTS[status]}>{STOCK_LABELS[status]}</Badge>
  );
}
