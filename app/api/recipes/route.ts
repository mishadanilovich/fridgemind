import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, unauthorized, forbidden } from "@/lib/auth";
import { recipeInputSchema } from "@/lib/zod-schemas";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const recipes = await prisma.recipe.findMany({
    where: { householdId: user.householdId },
    include: {
      steps: { orderBy: { order: "asc" } },
      ingredients: { include: { ingredient: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ recipes });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ["ORGANIZER", "EDITOR"])) return forbidden();

  const body = await request.json();
  const parsed = recipeInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // TODO (этап 4): создать Recipe + RecipeStep[] + RecipeIngredient[] в транзакции, householdId = user.householdId
  return NextResponse.json({ ok: true }, { status: 201 });
}
