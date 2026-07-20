import { prisma } from "@/lib/prisma";
import { matchCounts } from "@/lib/recipes";
import type { RecipeCardView, RecipeWithDetails } from "@/lib/types";

// Рецепт household со всеми шагами и ингредиентами — общий источник для экранов просмотра
// и редактирования. Soft-deleted рецепты по умолчанию скрыты; includeDeleted: true нужен
// только для read-only просмотра из истории меню (см. issue #5), не для редактирования.
export async function getRecipeDetail(
  householdId: string,
  id: string,
  opts?: { includeDeleted?: boolean },
): Promise<RecipeWithDetails | null> {
  return prisma.recipe.findFirst({
    where: { id, householdId, deletedAt: opts?.includeDeleted ? undefined : null },
    include: {
      steps: { orderBy: { order: "asc" } },
      ingredients: { include: { ingredient: true } },
    },
  });
}

// Карточки рецептов household для экрана "Рецепты" с подсчётом совпадения с инвентарём.
// onlyHave — сортировка по доле уже имеющихся ингредиентов (иначе по дате создания).
export async function getRecipeCards(
  householdId: string,
  onlyHave: boolean,
): Promise<RecipeCardView[]> {
  const [recipes, pantry] = await Promise.all([
    prisma.recipe.findMany({
      where: { householdId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        ingredients: {
          select: { ingredientId: true, ingredient: { select: { name: true } } },
        },
      },
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
      isFavorite: r.isFavorite,
      matchHave: have,
      matchTotal: total,
      ingredientNames: r.ingredients.map((i) => i.ingredient.name),
    };
  });

  if (onlyHave) {
    const ratio = (c: RecipeCardView) => (c.matchTotal > 0 ? c.matchHave / c.matchTotal : -1);
    cards.sort((a, b) => ratio(b) - ratio(a));
  }

  return cards;
}
