import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, unauthorized } from "@/lib/auth";

// Инвентарь без ограничений по ролям — любой участник household (см. CLAUDE.md, раздел 5).

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const items = await prisma.pantryItem.findMany({
    where: { householdId: user.householdId },
    include: { ingredient: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  // TODO (этап 5): upsert PantryItem по [householdId, ingredientId] (@@unique в schema.prisma)
  return NextResponse.json({ ok: true }, { status: 201 });
}
