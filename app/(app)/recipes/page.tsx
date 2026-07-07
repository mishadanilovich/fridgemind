import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";

import { ScreenHeader } from "@/components/nav/ScreenHeader";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { RecipeSortToggle } from "@/components/recipes/RecipeSortToggle";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getRecipeCards } from "@/lib/queries/recipes";

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
      <RecipeSortToggle active={onlyHave} />

      {canEdit && (
        <Link
          href="/recipes/new"
          className="mb-3 flex items-center gap-[13px] rounded-[20px] border-[1.5px] border-dashed border-[hsl(var(--nav-inactive))] px-[11px] py-[19px]"
        >
          <span className="flex size-[52px] shrink-0 items-center justify-center rounded-[15px] bg-success text-primary">
            <Plus className="size-[26px]" strokeWidth={2.4} />
          </span>
          <span>
            <span className="block font-heading text-[17px] font-bold leading-[1.1] text-primary">
              Добавить рецепт
            </span>
            <span className="mt-0.5 block text-[12.5px] font-medium text-muted-foreground">
              Ингредиенты, шаги, фото
            </span>
          </span>
        </Link>
      )}

      {cards.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Пока нет рецептов"
          description={
            canEdit
              ? "Добавьте первый рецепт, чтобы собирать из них меню на неделю."
              : "Рецепты добавляют Организатор и Редактор."
          }
        />
      ) : (
        cards.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} canEdit={canEdit} />)
      )}
    </div>
  );
}
