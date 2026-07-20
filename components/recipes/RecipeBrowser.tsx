"use client";

import { BookOpen, Heart, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { RecipeCard } from "@/components/recipes/RecipeCard";
import { RecipeSortToggle } from "@/components/recipes/RecipeSortToggle";
import { EmptyState } from "@/components/ui/empty-state";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { SearchInput, SearchNoResults } from "@/components/ui/search-input";
import { useLocalSearch } from "@/lib/hooks/use-local-search";
import { matchesQuery } from "@/lib/search";
import type { RecipeCardView } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  cards: RecipeCardView[];
  canEdit: boolean;
  sortActive: boolean;
};

function filterRecipes(cards: RecipeCardView[], query: string) {
  return cards.filter((c) => matchesQuery([c.title, ...c.ingredientNames], query));
}

export function RecipeBrowser({ cards, canEdit, sortActive }: Props) {
  const { query, setQuery, results, noResults } = useLocalSearch(cards, filterRecipes);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);

  // Избранное целиком (сердечки и фильтр) — только Организатору/Редактору, см. CLAUDE.md §5.
  const favoritesOn = canEdit && onlyFavorites;
  const visible = favoritesOn ? results.filter((r) => r.isFavorite) : results;
  const nothingToShow = cards.length > 0 && visible.length === 0;

  return (
    <>
      {cards.length > 0 && (
        <div className="mb-3 flex items-stretch gap-[9px]">
          <SearchInput
            className="min-w-0 flex-1"
            value={query}
            onChange={setQuery}
            placeholder="Поиск рецептов"
          />
          {canEdit && (
            <button
              type="button"
              onClick={() => setOnlyFavorites((v) => !v)}
              aria-pressed={onlyFavorites}
              className={cn(
                "pressable flex shrink-0 items-center gap-[7px] rounded-input border px-[15px] text-[13px] font-bold",
                onlyFavorites
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-card text-foreground",
              )}
            >
              <Heart
                className={cn("size-[17px]", onlyFavorites && "fill-current")}
                strokeWidth={1.9}
              />
              Избранное
            </button>
          )}
        </div>
      )}

      {favoriteError && <FormErrorBanner message={favoriteError} className="mb-3" />}

      <RecipeSortToggle active={sortActive} />

      {canEdit && (
        <Link
          href="/recipes/new"
          className="pressable mb-3 flex items-center gap-[13px] rounded-card border-[1.5px] border-dashed border-nav-inactive px-[11px] py-[19px]"
        >
          <span className="flex size-[52px] shrink-0 items-center justify-center rounded-lg bg-success text-primary">
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
      ) : nothingToShow ? (
        <SearchNoResults
          description={
            noResults
              ? "Проверьте запрос — поиск идёт по названию рецепта и его ингредиентам."
              : "В избранном пока пусто — отметьте рецепт сердечком, чтобы он попал сюда."
          }
        />
      ) : (
        visible.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            canEdit={canEdit}
            onFavoriteError={setFavoriteError}
          />
        ))
      )}
    </>
  );
}
