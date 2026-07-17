"use client";

import { BookOpen, Plus, SearchX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { RecipeCard } from "@/components/recipes/RecipeCard";
import { RecipeSortToggle } from "@/components/recipes/RecipeSortToggle";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { matchesQuery } from "@/lib/search";
import type { RecipeCardView } from "@/lib/types";

type Props = {
  cards: RecipeCardView[];
  canEdit: boolean;
  sortActive: boolean;
};

export function RecipeBrowser({ cards, canEdit, sortActive }: Props) {
  const [query, setQuery] = useState("");

  const filtered = cards.filter((c) => matchesQuery([c.title, ...c.ingredientNames], query));

  return (
    <>
      {cards.length > 0 && (
        <div className="mb-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Поиск рецептов" />
        </div>
      )}

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
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Ничего не найдено"
          description="Проверьте запрос — поиск идёт по названию рецепта и его ингредиентам."
        />
      ) : (
        filtered.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} canEdit={canEdit} />)
      )}
    </>
  );
}
