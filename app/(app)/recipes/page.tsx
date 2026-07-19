import { ScreenHeader } from "@/components/nav/ScreenHeader";
import { OfflineSnapshot } from "@/components/offline/OfflineSnapshot";
import { RecipeBrowser } from "@/components/recipes/RecipeBrowser";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getRecipeCards } from "@/lib/queries/recipes";
import { toRecipeListSnapshot } from "@/lib/recipes";

type Props = PageProps<"/recipes">;

export default async function RecipesPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) return null;

  const onlyHave = (await searchParams).have === "1";
  const canEdit = hasRole(user, ["ORGANIZER", "EDITOR"]);
  const cards = await getRecipeCards(user.householdId, onlyHave);

  return (
    <div className="pb-8">
      <ScreenHeader eyebrow="Библиотека" title="Рецепты" />
      <RecipeBrowser cards={cards} canEdit={canEdit} sortActive={onlyHave} />
      <OfflineSnapshot
        householdId={user.householdId}
        snapshot={{ table: "recipeLists", id: "all", data: toRecipeListSnapshot(cards) }}
      />
    </div>
  );
}
