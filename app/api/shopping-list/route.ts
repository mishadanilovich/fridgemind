import { NextResponse } from "next/server";

import { getCurrentUser, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { manualShoppingItemInputSchema } from "@/lib/zod-schemas";

// Список покупок — без ограничений по ролям (см. CLAUDE.md, раздел 5).

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const days = searchParams.getAll("day"); // ISO-даты выбранных дней, пусто = вся неделя

  // TODO (этап 7): при непустом `days` пересчитывать quantity через ShoppingListItemMeal
  void days;

  const items = await prisma.shoppingListItem.findMany({
    where: { householdId: user.householdId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await request.json();
  const parsed = manualShoppingItemInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // TODO (этап 8): создать ShoppingListItem с isManual = true, ingredientId = null, manualCategory из parsed.data
  return NextResponse.json({ ok: true }, { status: 201 });
}
