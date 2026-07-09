import { groupPantryItems, type PantryGroup } from "@/lib/pantry";
import { prisma } from "@/lib/prisma";

export async function getPantryGroups(householdId: string): Promise<PantryGroup[]> {
  const items = await prisma.pantryItem.findMany({
    where: { householdId },
    include: { ingredient: true },
  });
  return groupPantryItems(items);
}
