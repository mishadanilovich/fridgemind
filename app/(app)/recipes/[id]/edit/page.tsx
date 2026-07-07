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

  return <RecipeForm recipe={recipe} />;
}
