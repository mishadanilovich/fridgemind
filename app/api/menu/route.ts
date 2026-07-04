import { NextResponse } from "next/server";

// Запись/изменение MenuDayMeal — требует роль ORGANIZER или EDITOR (см. CLAUDE.md, раздел 5).
// TODO: проверка роли на бэкенде обязательна, не только скрытие кнопок в UI.

export async function GET() {
  // TODO: prisma.menuWeek.findFirst({ where: { householdId, weekStartDate } , include: { days: { include: { meals: { include: { recipe: true, mealSlot: true } } } } } })
  return NextResponse.json({ week: null });
}

export async function POST() {
  // TODO: создать/обновить MenuDayMeal (назначить рецепт в слот), servings по умолчанию = Recipe.baseServings
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE() {
  // TODO: поток "убрать рецепт из дня меню" — удалить запись MenuDayMeal, слот возвращается в "+ добавить рецепт"
  return NextResponse.json({ ok: true });
}
