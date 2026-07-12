import { NextResponse } from "next/server";

import { getCurrentUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Только чтение — для офлайн-кэша меню (см. CLAUDE.md §6, "Офлайн").
// Назначение и удаление рецепта в слоте идут через server actions (lib/actions/menu.ts).

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
