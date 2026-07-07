"use server";

import { getCurrentUser } from "@/lib/auth";
import { firstIssue } from "@/lib/form-state";
import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { Ingredient } from "@/lib/types";
import { ingredientInputSchema } from "@/lib/zod-schemas";

// Справочник Ingredient глобальный — читается и пополняется любым залогиненным пользователем
// (см. CLAUDE.md §5 "Справочник ингредиентов", RLS ingredients).
export async function searchIngredients(query: string): Promise<Ingredient[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const q = query.trim();
  return prisma.ingredient.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    take: 20,
  });
}

export type CreateIngredientResult =
  | { error: string; ingredient?: undefined }
  | { error: null; ingredient: Ingredient };

// Имя уникально: при повторе/гонке возвращаем существующую запись, а не падаем.
export async function createIngredient(input: unknown): Promise<CreateIngredientResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Не авторизован" };

  const parsed = ingredientInputSchema.safeParse(input);
  if (!parsed.success) return { error: firstIssue(parsed.error.issues) };

  const existing = await prisma.ingredient.findFirst({
    where: { name: { equals: parsed.data.name, mode: "insensitive" } },
  });
  if (existing) return { error: null, ingredient: existing };

  try {
    const ingredient = await prisma.ingredient.create({ data: parsed.data });
    return { error: null, ingredient };
  } catch (e) {
    // Параллельное создание того же имени — уникальный индекс сработал первым: перечитываем.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const raced = await prisma.ingredient.findFirst({
        where: { name: { equals: parsed.data.name, mode: "insensitive" } },
      });
      if (raced) return { error: null, ingredient: raced };
    }
    throw e;
  }
}
