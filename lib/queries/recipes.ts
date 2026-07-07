import { prisma } from "@/lib/prisma";
import { matchCounts } from "@/lib/recipes";
import type { RecipeCardView } from "@/lib/types";

// Карточки рецептов household для экрана "Рецепты" с подсчётом совпадения с инвентарём.
// onlyHave — сортировка по доле уже имеющихся ингредиентов (иначе по дате создания).
export async function getRecipeCards(
  householdId: string,
  onlyHave: boolean,
): Promise<RecipeCardView[]> {
  const [recipes, pantry] = await Promise.all([
    prisma.recipe.findMany({
      where: { householdId },
      orderBy: { createdAt: "desc" },
      include: { ingredients: { select: { ingredientId: true } } },
    }),
    prisma.pantryItem.findMany({
      where: { householdId },
      select: { ingredientId: true },
    }),
  ]);

  const pantrySet = new Set(pantry.map((p) => p.ingredientId));
  const cards: RecipeCardView[] = recipes.map((r) => {
    const { have, total } = matchCounts(
      r.ingredients.map((i) => i.ingredientId),
      pantrySet,
    );
    return {
      id: r.id,
      title: r.title,
      photoUrl: r.photoUrl,
      cookTimeMinutes: r.cookTimeMinutes,
      cookingMethods: r.cookingMethods,
      matchHave: have,
      matchTotal: total,
    };
  });

  if (onlyHave) {
    const ratio = (c: RecipeCardView) => (c.matchTotal > 0 ? c.matchHave / c.matchTotal : -1);
    cards.sort((a, b) => ratio(b) - ratio(a));
  }

  return cards;
}
