export const STANDARD_UNITS = ["м²", "м.п.", "м³", "шт", "компл", "услуга", "т", "кг", "л"] as const;

export const UNIT_OTHER = "__other__";

export function isStandardUnit(value: string): boolean {
  return (STANDARD_UNITS as readonly string[]).includes(value);
}
