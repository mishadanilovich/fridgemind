import { NextResponse } from "next/server";

import { getCurrentUser, unauthorized } from "@/lib/auth";
import { isIsoDate, startOfWeekIso, todayIso } from "@/lib/dates";
import { createManualShoppingItem, getShoppingListView } from "@/lib/queries/shopping-list";
import { neededQuantity } from "@/lib/shopping-list";
import { manualShoppingItemInputSchema } from "@/lib/zod-schemas";

// Список покупок — без ограничений по ролям (см. CLAUDE.md, раздел 5).

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const days = searchParams.getAll("day"); // ISO-даты выбранных дней, пусто = вся неделя
  if (days.some((day) => !isIsoDate(day))) {
    return NextResponse.json({ error: "Некорректная дата" }, { status: 400 });
  }

  // Текущая неделя: quantity каждой позиции пересчитывается под выбранные дни через вклады
  // ShoppingListItemMeal минус остаток дома; полностью покрытые запасами позиции не отдаются
  // (см. CLAUDE.md §6, поток "фильтр по дням").
  const view = await getShoppingListView(user.householdId, startOfWeekIso(todayIso()));
  const filter = days.length > 0 ? days : null;
  const items = view
    .map((item) => ({ ...item, quantity: neededQuantity(item, filter) }))
    .filter((item) => item.quantity > 0);

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

  const created = await createManualShoppingItem(user.householdId, parsed.data);
  return NextResponse.json({ id: created.id }, { status: 201 });
}
