import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recipeInputSchema } from "@/lib/zod-schemas";

// TODO: получить householdId и role текущего пользователя из сессии Supabase Auth;
// проверить role === ORGANIZER || EDITOR перед записью (см. CLAUDE.md, раздел 5 "Роли в household" —
// проверка на бэкенде, не только скрытие кнопок в UI).

export async function GET() {
  // TODO: prisma.recipe.findMany({ where: { householdId }, include: { steps: true, ingredients: true } })
  return NextResponse.json({ recipes: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = recipeInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // TODO: создать Recipe + RecipeStep[] + RecipeIngredient[] в транзакции, привязать householdId
  void prisma;
  return NextResponse.json({ ok: true }, { status: 201 });
}
