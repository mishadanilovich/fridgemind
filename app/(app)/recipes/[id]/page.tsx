import { notFound } from "next/navigation";

import { RecipeDetail } from "@/components/recipes/RecipeDetail";
import { getCurrentUser } from "@/lib/auth";
import { getRecipeDetail } from "@/lib/queries/recipes";

type Props = PageProps<"/recipes/[id]">;

export default async function RecipeDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const recipe = await getRecipeDetail(user.householdId, id);
  if (!recipe) notFound();

  return <RecipeDetail recipe={recipe} />;
}
