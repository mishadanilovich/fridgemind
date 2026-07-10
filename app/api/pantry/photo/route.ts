import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import { getCurrentUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { VisionImage } from "@/lib/vision";
import { recognizeProducts, VisionParseError } from "@/lib/vision";
import { consumeVisionCall, releaseVisionCall, visionDailyLimit } from "@/lib/vision-usage";

// Поток "фото холодильника" (см. CLAUDE.md, раздел 6): одно или несколько сжатых на клиенте
// фото за один запрос → один вызов Claude Vision со всеми изображениями и справочником →
// распознанный список возвращается клиенту на подтверждение (сохранение в PantryItem —
// отдельный server action confirmRecognizedProducts).

const MAX_PHOTOS = 5;
const MAX_BYTES = 2 * 1024 * 1024; // с запасом: клиент сжимает до ~0.6 МБ
const ALLOWED_TYPES = new Set(["image/webp", "image/jpeg", "image/png", "image/gif"]);
// Стоимость промпта растёт линейно со справочником — отправляем не больше этого числа пунктов.
// Продукт за пределами среза модель пометит новым, а resolveIngredient склеит его по имени.
const CATALOG_PROMPT_LIMIT = 200;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const formData = await request.formData();
  const photos = formData.getAll("photos").filter((p): p is File => p instanceof File);

  if (photos.length === 0) {
    return NextResponse.json({ error: "Нужно хотя бы одно фото" }, { status: 400 });
  }
  if (photos.length > MAX_PHOTOS) {
    return NextResponse.json({ error: `Не больше ${MAX_PHOTOS} фото за раз` }, { status: 400 });
  }
  for (const photo of photos) {
    if (!ALLOWED_TYPES.has(photo.type)) {
      return NextResponse.json({ error: "Неподдерживаемый формат изображения" }, { status: 400 });
    }
    if (photo.size > MAX_BYTES) {
      return NextResponse.json({ error: "Фото слишком большое" }, { status: 400 });
    }
  }

  if (!(await consumeVisionCall(user.householdId))) {
    return NextResponse.json(
      { error: `Дневной лимит распознаваний исчерпан (${visionDailyLimit()} в день)` },
      { status: 429 },
    );
  }

  try {
    const catalog = await prisma.ingredient.findMany({
      select: { id: true, name: true, defaultUnitType: true },
      orderBy: { name: "asc" },
      take: CATALOG_PROMPT_LIMIT,
    });

    const images: VisionImage[] = await Promise.all(
      photos.map(async (photo) => ({
        mediaType: photo.type as VisionImage["mediaType"],
        data: Buffer.from(await photo.arrayBuffer()).toString("base64"),
      })),
    );

    const result = await recognizeProducts(images, catalog);
    return NextResponse.json(result);
  } catch (e) {
    // Любой сбой после списания квоты возвращает вызов в лимит: платим только за удавшееся.
    await releaseVisionCall(user.householdId);
    if (e instanceof VisionParseError) {
      return NextResponse.json(
        { error: "Не удалось распознать продукты. Попробуйте ещё раз." },
        { status: 502 },
      );
    }
    if (e instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: "Сервис распознавания сейчас недоступен. Попробуйте позже." },
        { status: 502 },
      );
    }
    throw e;
  }
}
