import { notFound } from "next/navigation";

import { OfflineSnapshot } from "@/components/offline/OfflineSnapshot";
import { RecipeDetail } from "@/components/recipes/RecipeDetail";
import { getCurrentUser } from "@/lib/auth";
import { getRecipeDetail } from "@/lib/queries/recipes";

type Props = PageProps<"/recipes/[id]">;

export default async function RecipeDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  // includeDeleted: страница просмотра открывается и для soft-deleted рецепта — по ссылке из
  // истории меню (уже отмеченные "скушано"). Edit/delete в самом рецепте нет, так что она
  // остаётся read-only; список рецептов такой рецепт не показывает (см. issue #5).
  const recipe = await getRecipeDetail(user.householdId, id, { includeDeleted: true });
  if (!recipe) notFound();

  return (
    <>
      <RecipeDetail recipe={recipe} />
      <OfflineSnapshot
        householdId={user.householdId}
        snapshot={{ table: "recipes", id: recipe.id, data: recipe }}
      />
    </>
  );
}
