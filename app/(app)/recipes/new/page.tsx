import { redirect } from "next/navigation";

import { RecipeForm } from "@/components/recipes/RecipeForm";
import { getCurrentUser, hasRole } from "@/lib/auth";

export default async function NewRecipePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!hasRole(user, ["ORGANIZER", "EDITOR"])) redirect("/recipes");

  return <RecipeForm />;
}
