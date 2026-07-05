import { NextResponse } from "next/server";

import { visionRecognitionResponseSchema } from "@/lib/zod-schemas";

// Поток "фото холодильника" — см. CLAUDE.md, раздел 6.
// Принимает ОДИН или НЕСКОЛЬКО сжатых на клиенте фото за один запрос, один вызов Claude Vision
// сразу со всеми изображениями + списком названий из справочника Ingredient для сопоставления.
// Модель сама схлопывает дубли между фото и решает matchedIngredientId (см. раздел 5,
// "Справочник ингредиентов") — отдельный fuzzy-matching на бэкенде не нужен.

export async function POST(request: Request) {
  const formData = await request.formData();
  const photos = formData.getAll("photos"); // File[] — минимум 1

  if (photos.length === 0) {
    return NextResponse.json({ error: "Нужно хотя бы одно фото" }, { status: 400 });
  }

  // TODO:
  // 1. Загрузить справочник Ingredient (id + name) для передачи в промпт
  // 2. Собрать один запрос к Claude API (vision) со всеми `photos` + system-промпт:
  //    "верни JSON списка продуктов, сопоставь с справочником где возможно, не дублируй между фото"
  // 3. Провалидировать ответ через visionRecognitionResponseSchema (см. lib/zod-schemas.ts) —
  //    НЕ доверять сырому ответу модели напрямую
  // 4. Вернуть распознанный список клиенту для подтверждения (сохранение в PantryItem —
  //    отдельный запрос после подтверждения пользователем)

  const mockResponse = visionRecognitionResponseSchema.parse({ products: [] });
  return NextResponse.json(mockResponse);
}
