"use server";

import { requireRole } from "@/lib/auth";
import { createStorageAdminClient } from "@/lib/supabase-admin";

const BUCKET = "recipe-photos";
const MAX_BYTES = 2 * 1024 * 1024; // с запасом: клиент сжимает до ~0.6 МБ
const ALLOWED = new Set(["image/webp", "image/jpeg", "image/png"]);
const EXT: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export type UploadResult = { error: string; url?: undefined } | { error: null; url: string };

// Загрузка фото рецепта/шага. Права проверяются здесь (Редактор/Организатор), запись в Storage
// идёт сервис-ролью (см. lib/supabase-admin). Путь неймспейснут по household.
export async function uploadRecipePhoto(formData: FormData): Promise<UploadResult> {
  const user = await requireRole(["ORGANIZER", "EDITOR"]);
  if (!user) return { error: "Недостаточно прав" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Файл не передан" };
  if (!ALLOWED.has(file.type)) return { error: "Неподдерживаемый формат изображения" };
  if (file.size > MAX_BYTES) return { error: "Файл слишком большой" };

  const path = `${user.householdId}/${crypto.randomUUID()}.${EXT[file.type]}`;

  const storage = createStorageAdminClient();
  const { error } = await storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { error: "Не удалось загрузить фото. Попробуйте ещё раз." };

  const { data } = storage.from(BUCKET).getPublicUrl(path);
  return { error: null, url: data.publicUrl };
}
