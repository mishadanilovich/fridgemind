import { NextResponse } from "next/server";

import { forbidden, getCurrentUser, hasRole, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Запись/изменение MenuDayMeal — роль ORGANIZER или EDITOR (см. CLAUDE.md, раздел 5).

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const week = await prisma.menuWeek.findFirst({
    where: { householdId: user.householdId },
    orderBy: { weekStartDate: "desc" },
    include: {
      days: { include: { meals: { include: { recipe: true, mealSlot: true } } } },
    },
  });

  return NextResponse.json({ week });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ["ORGANIZER", "EDITOR"])) return forbidden();

  // TODO (этап 6): создать/обновить MenuDayMeal (назначить рецепт в слот), servings по умолчанию = Recipe.baseServings
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ["ORGANIZER", "EDITOR"])) return forbidden();

  // TODO (этап 6): удалить MenuDayMeal (убрать рецепт из слота)
  return NextResponse.json({ ok: true });
}
