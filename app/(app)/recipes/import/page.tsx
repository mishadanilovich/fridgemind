import { redirect } from "next/navigation";

import { RecipeImport } from "@/components/recipes/RecipeImport";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function RecipeImportPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!hasRole(user, ["ORGANIZER", "EDITOR"])) redirect("/recipes");

  // Каталог глобальный и для personal-use небольшой: имена идут в промпт для авто-сопоставления,
  // а сам список (id + name) — в селект «сопоставить с существующим» на экране подтверждения.
  const ingredients = await prisma.ingredient.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, defaultUnitType: true },
  });

  return <RecipeImport ingredients={ingredients} />;
}
