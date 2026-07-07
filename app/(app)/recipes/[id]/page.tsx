import { notFound } from "next/navigation";

import { RecipeDetail } from "@/components/recipes/RecipeDetail";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = PageProps<"/recipes/[id]">;

export default async function RecipeDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null; // layout уже редиректит неавторизованных

  const recipe = await prisma.recipe.findFirst({
    where: { id, householdId: user.householdId },
    include: {
      steps: { orderBy: { order: "asc" } },
      ingredients: { include: { ingredient: true } },
    },
  });
  if (!recipe) notFound();

  return <RecipeDetail recipe={recipe} />;
}
