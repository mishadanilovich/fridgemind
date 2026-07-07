// Способы приготовления — локализованные названия и иконки для бейджей (см. CLAUDE.md,
// раздел 5 "Способ приготовления"). Общий источник для карточек рецептов, экрана "Сегодня"
// и мультиселекта в форме — по образцу ROLE_LABELS, чтобы не держать параллельные списки.

import { Beef, CookingPot, Flame, type LucideIcon, Microwave, Salad, Soup } from "lucide-react";

import type { CookingMethod } from "./types";

export const COOKING_METHOD_LABELS: Record<CookingMethod, string> = {
  STOVETOP: "Плита",
  OVEN: "Духовка",
  MULTICOOKER: "Мультиварка",
  GRILL: "Гриль",
  MICROWAVE: "Микроволновка",
  NO_COOK: "Без готовки",
};

export const COOKING_METHOD_ICONS: Record<CookingMethod, LucideIcon> = {
  STOVETOP: Flame,
  OVEN: CookingPot,
  MULTICOOKER: Soup,
  GRILL: Beef,
  MICROWAVE: Microwave,
  NO_COOK: Salad,
};

// Порядок вывода в мультиселекте/бейджах = порядок ключей в лейблах.
export const COOKING_METHODS = Object.keys(COOKING_METHOD_LABELS) as CookingMethod[];
