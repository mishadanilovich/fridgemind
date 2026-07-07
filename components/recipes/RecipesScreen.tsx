"use client";

import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import type { RecipeCardView } from "@/lib/types";
import { cn } from "@/lib/utils";

import { RecipeCard } from "./RecipeCard";

type Props = {
  recipes: RecipeCardView[];
  canEdit: boolean;
};

function matchRatio(r: RecipeCardView): number {
  return r.matchTotal > 0 ? r.matchHave / r.matchTotal : -1;
}

// Экран "Рецепты" (макет isRecipes): тумблер "приготовить из того, что есть" пересортировывает
// список по наличию продуктов; карточка добавления — первым элементом, только Редактору.
export function RecipesScreen({ recipes, canEdit }: Props) {
  const [onlyHave, setOnlyHave] = useState(false);

  const sorted = useMemo(
    () => (onlyHave ? [...recipes].sort((a, b) => matchRatio(b) - matchRatio(a)) : recipes),
    [recipes, onlyHave],
  );

  return (
    <div>
      <button
        type="button"
        onClick={() => setOnlyHave((v) => !v)}
        className={cn(
          "mb-[18px] flex w-full items-center justify-between gap-3 rounded-[18px] border px-4 py-[13px] text-left",
          onlyHave ? "border-primary/30 bg-success" : "border-border bg-card",
        )}
      >
        <span className="flex items-center gap-[11px]">
          <span
            className={cn(
              "flex size-[34px] items-center justify-center rounded-[11px]",
              onlyHave ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
            )}
          >
            <BookOpen className="size-[19px]" />
          </span>
          <span>
            <span className="block text-sm font-bold text-foreground">
              Приготовить из того, что есть
            </span>
            <span className="block text-[11.5px] font-medium text-muted-foreground">
              Сортировка по наличию продуктов
            </span>
          </span>
        </span>
        <span
          className={cn(
            "relative h-[27px] w-[46px] shrink-0 rounded-full transition-colors",
            onlyHave ? "bg-primary" : "bg-secondary",
          )}
        >
          <span
            className={cn(
              "absolute top-[3px] size-[21px] rounded-full bg-white shadow transition-all",
              onlyHave ? "left-[22px]" : "left-[3px]",
            )}
          />
        </span>
      </button>

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

      {sorted.length === 0 ? (
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
        sorted.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} canEdit={canEdit} />)
      )}
    </div>
  );
}
