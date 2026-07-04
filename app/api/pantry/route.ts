import { NextResponse } from "next/server";

// Инвентарь без ограничений по ролям — любой участник household может добавлять/менять/удалять
// (см. CLAUDE.md, раздел 5 "Роли в household").

export async function GET() {
  // TODO: prisma.pantryItem.findMany({ where: { householdId }, include: { ingredient: true } })
  return NextResponse.json({ items: [] });
}

export async function POST() {
  // TODO: upsert PantryItem по [householdId, ingredientId] — см. @@unique в prisma/schema.prisma
  return NextResponse.json({ ok: true }, { status: 201 });
}
