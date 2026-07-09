import Anthropic from "@anthropic-ai/sdk";

import { UNIT_TYPE_TO_UNIT } from "./units";
import type { VisionRecognitionResponse } from "./zod-schemas";
import { visionRecognitionResponseSchema } from "./zod-schemas";

// Изолированный модуль "фото → JSON списка продуктов" (см. CLAUDE.md §9): один вызов Claude
// Vision сразу со всеми фото и списком справочника; сопоставление с существующими Ingredient
// делает сама модель, отдельный fuzzy-matching на бэкенде не нужен.

export type CatalogEntry = { id: string; name: string };

export type VisionImage = {
  mediaType: "image/webp" | "image/jpeg" | "image/png" | "image/gif";
  data: string; // base64 без переносов строк
};

// Haiku 4.5 — достаточен для распознавания продуктов и на порядок дешевле старших моделей
// (решение из обсуждения стоимости); модель можно переопределить через env VISION_MODEL.
const DEFAULT_VISION_MODEL = "claude-haiku-4-5";

export function visionModel(): string {
  return process.env.VISION_MODEL || DEFAULT_VISION_MODEL;
}

export class VisionParseError extends Error {}

export function buildVisionPrompt(catalog: CatalogEntry[]): string {
  const catalogLines = catalog.map((c) => `${c.id}\t${c.name}`).join("\n");
  return `Ты распознаёшь продукты на фото домашних запасов (холодильник, морозилка, полки с продуктами).
Тебе даны одно или несколько фото и справочник продуктов приложения.

Верни СТРОГО один JSON-объект без пояснений и без markdown, вида:
{"products":[{"name":"Молоко","matchedIngredientId":"id-или-null","quantity":1000,"unitType":"VOLUME","unit":"ML","category":"DAIRY","confidence":0.9}]}

Правила:
- Один и тот же продукт, видимый на нескольких фото, — одна запись (не дублируй).
- name — короткое название по-русски с заглавной буквы ("Молоко", "Яйца", "Морковь").
- Если продукт соответствует пункту справочника — matchedIngredientId = его id, а name — точно как в справочнике; иначе matchedIngredientId = null.
- quantity — примерная оценка в базовой единице: граммы для WEIGHT, миллилитры для VOLUME, штуки для COUNT. Точность не важна, важен порядок величины.
- unitType: жидкости — VOLUME; яйца, штучные овощи/фрукты и целые упаковки — COUNT; всё остальное — WEIGHT. unit строго соответствует: WEIGHT→G, VOLUME→ML, COUNT→PCS.
- category — одно из: DAIRY, MEAT_FISH, VEGETABLES_FRUITS, GROCERY, BAKERY, BEVERAGES, FROZEN, HOUSEHOLD_CHEMICALS, PERSONAL_CARE, OTHER.
- Не выдумывай продукты, которых не видно; посуду и несъедобные предметы пропускай (кроме явно видимой бытовой химии и гигиены).
- confidence — уверенность 0..1.
- Если продуктов не видно, верни {"products":[]}.

Справочник (id и название, разделены табуляцией):
${catalogLines || "(справочник пуст)"}`;
}

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}

// Валидирует и нормализует ответ модели: unit всегда выводится из unitType (модель не может
// назначить "мл" моркови), неизвестные справочнику matchedIngredientId сбрасываются в null,
// штучные количества округляются, продукты с пустым названием отбрасываются.
export function parseVisionResponse(
  raw: string,
  catalogIds: ReadonlySet<string>,
): VisionRecognitionResponse {
  let data: unknown;
  try {
    data = JSON.parse(extractJson(raw));
  } catch {
    throw new VisionParseError("Ответ модели не является JSON");
  }

  const parsed = visionRecognitionResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new VisionParseError("Ответ модели не соответствует ожидаемой схеме");
  }

  return {
    products: parsed.data.products
      .filter((p) => p.name.trim() !== "")
      .map((p) => {
        const unit = UNIT_TYPE_TO_UNIT[p.unitType];
        return {
          ...p,
          name: p.name.trim(),
          unit,
          quantity: unit === "PCS" ? Math.max(1, Math.round(p.quantity)) : p.quantity,
          matchedIngredientId:
            p.matchedIngredientId !== null && catalogIds.has(p.matchedIngredientId)
              ? p.matchedIngredientId
              : null,
        };
      }),
  };
}

export async function recognizeProducts(
  images: VisionImage[],
  catalog: CatalogEntry[],
): Promise<VisionRecognitionResponse> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: visionModel(),
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          ...images.map((img) => ({
            type: "image" as const,
            source: { type: "base64" as const, media_type: img.mediaType, data: img.data },
          })),
          { type: "text" as const, text: buildVisionPrompt(catalog) },
        ],
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return parseVisionResponse(text, new Set(catalog.map((c) => c.id)));
}
