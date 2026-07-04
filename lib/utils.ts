import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Базовая единица -> отображаемая (г→кг при >=1000, мл→л при >=1000, шт как есть). */
export function formatQuantity(quantity: number, unit: "G" | "ML" | "PCS"): string {
  if (unit === "PCS") return `${quantity} шт`;
  if (unit === "G") {
    return quantity >= 1000 ? `${(quantity / 1000).toFixed(1)} кг` : `${quantity} г`;
  }
  return quantity >= 1000 ? `${(quantity / 1000).toFixed(1)} л` : `${quantity} мл`;
}

/** Пропорциональный пересчёт количества под новое число порций (см. CLAUDE.md, раздел 5 "Порции"). */
export function scaleQuantity(
  baseQuantity: number,
  baseServings: number,
  targetServings: number,
  unit: "G" | "ML" | "PCS"
): number {
  const scaled = baseQuantity * (targetServings / baseServings);
  // COUNT округляется до целого — штуки нельзя купить дробно (раздел 5).
  return unit === "PCS" ? Math.round(scaled) : Math.round(scaled * 10) / 10;
}
