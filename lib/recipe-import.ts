import { z } from "zod";

import { PRODUCT_CATEGORY_LABELS } from "./product-categories";
import type { CookingMethod, ProductCategory, Unit } from "./types";

// Импорт рецептов из JSON (см. CLAUDE.md §5 "Импорт рецептов из JSON-файла"). Формат файла
// генерирует сторонний ИИ-чат по промпту из buildImportPrompt; единицы и способы приготовления
// приходят в нижнем регистре (g/ml/pcs, stovetop/…) и здесь приводятся к нашим enum'ам.

const importUnitSchema = z
  .enum(["g", "ml", "pcs"])
  .transform((v) => v.toUpperCase() as Unit);

const importCookingMethodSchema = z
  .enum(["stovetop", "oven", "multicooker", "grill", "microwave", "no_cook"])
  .transform((v) => v.toUpperCase() as CookingMethod);

const importRecipeSchema = z.object({
  title: z.string().trim().min(1, "у рецепта нет названия").max(120, "слишком длинное название"),
  baseServings: z.number().int().positive().max(99),
  cookTimeMinutes: z.number().int().positive().max(6000).nullable().optional(),
  cookingMethods: z.array(importCookingMethodSchema).optional().default([]),
  ingredients: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(60),
        quantity: z.number().positive(),
        unit: importUnitSchema,
      }),
    )
    .min(1, "у рецепта нет ингредиентов"),
  steps: z.array(z.string().trim().min(1)).min(1, "у рецепта нет шагов"),
});

export const recipeImportFileSchema = z.object({
  recipes: z.array(importRecipeSchema).min(1, "в файле нет рецептов").max(50, "слишком много рецептов за раз (максимум 50)"),
});

/** Один рецепт из файла в нормализованном виде (единицы/способы уже в наших enum'ах). */
export type ImportRecipe = z.infer<typeof importRecipeSchema>;

export type ParseImportResult =
  | { ok: true; recipes: ImportRecipe[] }
  | { ok: false; error: string };

// Разбор вставленного/загруженного текста: JSON.parse → Zod. Голый массив тоже принимаем
// (некоторые ИИ отдают массив без обёртки recipes), приводя к { recipes: [...] }.
export function parseImportJson(raw: string): ParseImportResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Вставьте JSON или загрузите файл." };

  let data: unknown;
  try {
    data = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "Не удалось разобрать JSON. Проверьте формат." };
  }
  if (Array.isArray(data)) data = { recipes: data };

  const parsed = recipeImportFileSchema.safeParse(data);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path.length ? ` (${issue.path.join(".")})` : "";
    return { ok: false, error: `Формат не подходит${where}: ${issue?.message ?? "проверьте файл"}.` };
  }
  return { ok: true, recipes: parsed.data.recipes };
}

const norm = (name: string) => name.trim().toLowerCase();

/** Ингредиент из файла, не найденный в справочнике по имени, — для экрана подтверждения.
 *  Уникален по имени (без регистра); unit — первый встреченный, задаёт unitType нового продукта. */
export type ImportUnmatched = { name: string; unit: Unit };

export type ImportRecipePreview = {
  title: string;
  baseServings: number;
  cookTimeMinutes: number | null;
  ingredientCount: number;
  stepCount: number;
  newIngredientNames: string[];
};

export type ImportPreview = {
  recipes: ImportRecipePreview[];
  unmatched: ImportUnmatched[];
};

// Превью импорта: помечает ингредиенты, которых нет в справочнике (existingLower — множество
// имён каталога в нижнем регистре), и собирает уникальный список несовпавших для резолвинга.
export function buildImportPreview(
  recipes: ImportRecipe[],
  existingLower: Set<string>,
): ImportPreview {
  const unmatched = new Map<string, ImportUnmatched>();

  const recipeViews: ImportRecipePreview[] = recipes.map((recipe) => {
    const newNames: string[] = [];
    for (const ing of recipe.ingredients) {
      const key = norm(ing.name);
      if (existingLower.has(key)) continue;
      newNames.push(ing.name.trim());
      if (!unmatched.has(key)) unmatched.set(key, { name: ing.name.trim(), unit: ing.unit });
    }
    return {
      title: recipe.title,
      baseServings: recipe.baseServings,
      cookTimeMinutes: recipe.cookTimeMinutes ?? null,
      ingredientCount: recipe.ingredients.length,
      stepCount: recipe.steps.length,
      newIngredientNames: [...new Set(newNames)],
    };
  });

  return { recipes: recipeViews, unmatched: [...unmatched.values()] };
}

// Промпт для стороннего ИИ-чата: формат + пример + список названий из справочника (чтобы ИИ
// использовал те же имена и % автосопоставления был выше) + пожелания пользователя.
export function buildImportPrompt(wishes: string, ingredientNames: string[]): string {
  const example = `{
  "recipes": [
    {
      "title": "Куриный суп",
      "baseServings": 4,
      "cookTimeMinutes": 40,
      "cookingMethods": ["stovetop"],
      "ingredients": [
        { "name": "Куриное филе", "quantity": 500, "unit": "g" },
        { "name": "Морковь", "quantity": 1, "unit": "pcs" },
        { "name": "Вода", "quantity": 1500, "unit": "ml" }
      ],
      "steps": [
        "Вскипятить воду, положить курицу целиком",
        "Через 20 минут добавить нарезанные овощи и варить ещё 15 минут"
      ]
    }
  ]
}`;

  const rules = [
    'Верни СТРОГО валидный JSON — объект с ключом "recipes", без пояснений и текста вокруг.',
    "Никакого поля с приёмом пищи (завтрак/обед/ужин) — рецепт к нему не привязан.",
    "cookingMethods — только: stovetop, oven, multicooker, grill, microwave, no_cook (поле необязательное).",
    "unit — только: g, ml, pcs. Никаких кг, л, ломтиков, зубчиков, головок.",
    "steps — просто строки, без фото.",
  ];

  const wishesLine = wishes.trim() || "несколько разных рецептов на ужин";

  const parts = [
    "Ты — помощник по кулинарии. Составь рецепты по запросу и верни их в формате ниже.",
    "",
    `Запрос: ${wishesLine}`,
    "",
    "Формат ответа:",
    example,
    "",
    "Правила:",
    ...rules.map((r) => `• ${r}`),
  ];

  if (ingredientNames.length > 0) {
    parts.push(
      "",
      "Для совпадающих продуктов используй ТОЧНО эти названия из справочника (чтобы они сопоставились автоматически):",
      ingredientNames.join(", "),
    );
  }

  return parts.join("\n");
}

// Резолвинг несовпавшего ингредиента на экране подтверждения: сопоставить с существующим
// продуктом справочника или создать новый с выбранной категорией.
export type ImportResolution =
  | { mode: "existing"; ingredientId: string }
  | { mode: "new"; category: ProductCategory };

export const importResolutionSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("existing"), ingredientId: z.string().min(1) }),
  z.object({
    mode: z.literal("new"),
    category: z.enum(Object.keys(PRODUCT_CATEGORY_LABELS) as [ProductCategory, ...ProductCategory[]]),
  }),
]);

// Подтверждение импорта: исходный JSON (сервер парсит его заново как источник истины) +
// резолвинги несовпавших имён (ключ — имя в нижнем регистре).
export const recipeImportConfirmSchema = z.object({
  json: z.string().min(1),
  resolutions: z.record(z.string(), importResolutionSchema),
});
