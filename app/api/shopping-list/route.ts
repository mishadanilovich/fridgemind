import { NextResponse } from "next/server";
import { manualShoppingItemInputSchema } from "@/lib/zod-schemas";

// Список покупок — без ограничений по ролям (см. CLAUDE.md, раздел 5).
// Фильтр по дням (see раздел 6, "Поток фильтр по дням") пересчитывает quantity на лету
// через ShoppingListItemMeal, а не хранит отдельную копию на каждую комбинацию дней.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = searchParams.getAll("day"); // ISO-даты выбранных дней, пусто = вся неделя

  // TODO: агрегировать ShoppingListItem (+ManualItems) для householdId/weekId;
  // если `days` непусто — суммировать только ShoppingListItemMeal, чей MenuDayMeal.menuDay.date в `days`
  void days;
  return NextResponse.json({ items: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = manualShoppingItemInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // TODO: создать ShoppingListItem с isManual = true, ingredientId = null, manualCategory из parsed.data
  return NextResponse.json({ ok: true }, { status: 201 });
}
