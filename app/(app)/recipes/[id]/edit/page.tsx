import { notFound, redirect } from "next/navigation";

import { RecipeForm } from "@/components/recipes/RecipeForm";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getRecipeDetail } from "@/lib/queries/recipes";

type Props = PageProps<"/recipes/[id]/edit">;

export default async function EditRecipePage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;
  if (!hasRole(user, ["ORGANIZER", "EDITOR"])) redirect("/recipes");

  const recipe = await getRecipeDetail(user.householdId, id);
  if (!recipe) notFound();

  return (
    <RecipeForm
      recipeId={recipe.id}
      initial={{
        title: recipe.title,
        baseServings: recipe.baseServings,
        cookTimeMinutes: recipe.cookTimeMinutes,
        cookingMethods: recipe.cookingMethods,
        ingredients: recipe.ingredients.map((ri) => ({
          ingredientId: ri.ingredientId,
          name: ri.ingredient.name,
          quantity: ri.quantity,
          unit: ri.unit,
        })),
        steps: recipe.steps.map((s) => ({ instruction: s.instruction })),
      }}
    />
  );
}
