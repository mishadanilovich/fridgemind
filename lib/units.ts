import type { Unit, UnitType } from "./types";

// К какому типу продукта относится базовая единица — для валидации выбора unit в форме.
export const UNIT_TO_TYPE: Record<Unit, UnitType> = {
  G: "WEIGHT",
  ML: "VOLUME",
  PCS: "COUNT",
};

// Единицы, допустимые для каждого типа продукта (нельзя выбрать "мл" для моркови).
export const UNITS_BY_TYPE: Record<UnitType, Unit[]> = {
  WEIGHT: ["G"],
  VOLUME: ["ML"],
  COUNT: ["PCS"],
};

// Базовая единица для типа продукта — сейчас у каждого типа ровно одна.
export const UNIT_TYPE_TO_UNIT: Record<UnitType, Unit> = {
  WEIGHT: "G",
  VOLUME: "ML",
  COUNT: "PCS",
};

// Локализованные названия типов продукта — для выбора при создании нового ингредиента.
export const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  WEIGHT: "Вес (г/кг)",
  VOLUME: "Объём (мл/л)",
  COUNT: "Штучно (шт)",
};

// Обрезает "хвост" плавающей точки до maxDecimals знаков без завершающих нулей.
function trimNumber(value: number, maxDecimals: number): string {
  const rounded = Number(value.toFixed(maxDecimals));
  return String(rounded);
}

export function formatQuantity(quantity: number, unit: Unit): string {
  switch (unit) {
    case "G":
      return quantity >= 1000 ? `${trimNumber(quantity / 1000, 2)} кг` : `${trimNumber(quantity, 0)} г`;
    case "ML":
      return quantity >= 1000 ? `${trimNumber(quantity / 1000, 2)} л` : `${trimNumber(quantity, 0)} мл`;
    case "PCS":
      return `${trimNumber(quantity, 0)} шт`;
  }
}

// Крупная единица отображения для каждой базовой (для лейблов в форме, где вводят в кг/л).
export const DISPLAY_UNIT_LABEL: Record<Unit, string> = {
  G: "г",
  ML: "мл",
  PCS: "шт",
};
