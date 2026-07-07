import { ScreenHeader } from "@/components/nav/ScreenHeader";
import { RecipesScreen } from "@/components/recipes/RecipesScreen";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { RecipeCardView } from "@/lib/types";

export default async function RecipesPage() {
  const user = await getCurrentUser();
  if (!user) return null; // layout уже редиректит неавторизованных

  const canEdit = hasRole(user, ["ORGANIZER", "EDITOR"]);

  const [recipes, pantry] = await Promise.all([
    prisma.recipe.findMany({
      where: { householdId: user.householdId },
      orderBy: { createdAt: "desc" },
      include: { ingredients: { select: { ingredientId: true } } },
    }),
    prisma.pantryItem.findMany({
      where: { householdId: user.householdId },
      select: { ingredientId: true },
    }),
  ]);

  const pantrySet = new Set(pantry.map((p) => p.ingredientId));
  const cards: RecipeCardView[] = recipes.map((r) => {
    const uniqueIds = new Set(r.ingredients.map((i) => i.ingredientId));
    let have = 0;
    for (const id of uniqueIds) if (pantrySet.has(id)) have += 1;
    return {
      id: r.id,
      title: r.title,
      photoUrl: r.photoUrl,
      cookTimeMinutes: r.cookTimeMinutes,
      cookingMethods: r.cookingMethods,
      matchHave: have,
      matchTotal: uniqueIds.size,
    };
  });

  return (
    <div className="pb-8">
      <ScreenHeader eyebrow="Библиотека" title="Рецепты" />
      <RecipesScreen recipes={cards} canEdit={canEdit} />
    </div>
  );
}
