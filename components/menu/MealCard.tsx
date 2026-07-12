"use client";

import { Check, Clock, Plus } from "lucide-react";
import Link from "next/link";

import { CookingMethodBadges } from "@/components/recipes/CookingMethodBadges";
import { RecipePhoto } from "@/components/recipes/RecipePhoto";
import type { MenuMealView } from "@/lib/types";

import { RemoveMealButton } from "./RemoveMealButton";

type Props = {
  slotName: string;
  meal: MenuMealView;
  canEdit: boolean;
};

export function MealCard({ slotName, meal, canEdit }: Props) {
  return (
    <div className="mb-4 overflow-hidden rounded-hero border border-border bg-card shadow-card">
      <Link href={`/recipes/${meal.recipeId}`} className="relative block h-[150px]">
        <RecipePhoto photoUrl={meal.photoUrl} fill sizes="420px" iconClassName="size-10" />
        <span className="absolute inset-0 bg-gradient-to-b from-transparent to-foreground/70" />

        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-[11px] py-[5px] text-[11px] font-bold uppercase tracking-[0.05em] text-primary backdrop-blur-sm">
          {slotName}
        </span>

        <span className="absolute right-3 top-3 flex items-center gap-1.5">
          {meal.cookTimeMinutes !== null && (
            <span className="flex items-center gap-1 rounded-full bg-background/90 px-[11px] py-[5px] text-[11px] font-bold text-foreground backdrop-blur-sm">
              <Clock className="size-3.5" strokeWidth={2.5} />
              ~{meal.cookTimeMinutes} мин
            </span>
          )}
          {meal.isEaten && (
            <span className="flex items-center gap-1 rounded-full bg-primary py-[5px] pl-2 pr-[11px] text-[11px] font-bold text-primary-foreground">
              <Check className="size-3.5" strokeWidth={3} />
              Съедено
            </span>
          )}
        </span>

        <span className="absolute inset-x-3.5 bottom-3 line-clamp-2 break-words font-heading text-[21px] font-bold leading-[1.1] text-white drop-shadow">
          {meal.title}
        </span>
      </Link>

      <div className="flex items-center justify-between gap-3 px-[15px] py-[13px]">
        <div className="flex flex-wrap items-center gap-2">
          <CookingMethodBadges methods={meal.cookingMethods} max={3} />
          <span className="text-[12.5px] font-semibold text-muted-foreground">
            {meal.servings} порц.
          </span>
        </div>

        {canEdit && (
          <RemoveMealButton
            mealId={meal.id}
            recipeTitle={meal.title}
            slotName={slotName}
            isEaten={meal.isEaten}
            className="size-8 shrink-0 rounded-md border border-border bg-background text-destructive backdrop-blur-none"
          />
        )}
      </div>
    </div>
  );
}

type EmptyProps = {
  slotName: string;
  onPick: () => void;
};

export function EmptySlotCard({ slotName, onPick }: EmptyProps) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="pressable mb-4 flex w-full items-center gap-[13px] rounded-hero border-[1.5px] border-dashed border-tan-dashed px-4 py-[18px] text-left"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-nav-inactive">
        <Plus className="size-6" strokeWidth={2.4} />
      </span>
      <span>
        <span className="block text-[11px] font-bold uppercase tracking-[0.05em] text-nav-inactive">
          {slotName}
        </span>
        <span className="mt-0.5 block font-heading text-[17px] font-bold leading-[1.1] text-foreground">
          Добавить рецепт
        </span>
      </span>
    </button>
  );
}
