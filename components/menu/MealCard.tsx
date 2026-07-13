"use client";

import { Check, Clock, Plus, Users, Utensils } from "lucide-react";
import Link from "next/link";

import { CookingMethodBadges } from "@/components/recipes/CookingMethodBadges";
import { RecipePhoto } from "@/components/recipes/RecipePhoto";
import { Button } from "@/components/ui/button";
import type { MenuMealView } from "@/lib/types";

import { RemoveMealButton } from "./RemoveMealButton";

type Props = {
  slotName: string;
  meal: MenuMealView;
  canEdit: boolean;
  /** Отметить приём съеденным — кнопка "Скушал" видна, пока приём не отмечен. */
  onEat?: () => void;
  eatPending?: boolean;
};

const PHOTO_BADGE_CLASS =
  "flex items-center gap-1 rounded-full bg-background/90 px-[11px] py-[5px] text-[11px] font-bold text-foreground backdrop-blur-sm";

export function MealCard({ slotName, meal, canEdit, onEat, eatPending }: Props) {
  return (
    <div className="mb-4 overflow-hidden rounded-hero border border-border bg-card shadow-card">
      <Link href={`/recipes/${meal.recipeId}`} className="relative block h-[150px]">
        <RecipePhoto photoUrl={meal.photoUrl} fill sizes="420px" iconClassName="size-10" />
        <span className="absolute inset-0 bg-gradient-to-b from-transparent to-foreground/70" />

        {/* justify-between вместо двух независимых absolute-углов: длинное имя слота и группа
            бейджей справа делят одну строку, а не рискуют наложиться друг на друга на узких экранах. */}
        <span className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span className="min-w-0 truncate rounded-full bg-background/90 px-[11px] py-[5px] text-[11px] font-bold uppercase tracking-[0.05em] text-primary backdrop-blur-sm">
            {slotName}
          </span>

          <span className="flex shrink-0 items-center gap-1.5">
            {/* Время и порции — одним бейджем на фото, чтобы нижняя строка осталась только
                под бейджи способов готовки и кнопки («Скушал» + убрать) и не переполнялась. */}
            <span className={PHOTO_BADGE_CLASS}>
              {meal.cookTimeMinutes !== null ? (
                <Clock className="size-3.5" strokeWidth={2.5} />
              ) : (
                <Users className="size-3.5" strokeWidth={2.5} />
              )}
              {meal.cookTimeMinutes !== null && `~${meal.cookTimeMinutes} мин · `}
              {meal.servings} порц.
            </span>
            {meal.isEaten && (
              <span className="flex items-center gap-1 rounded-full bg-primary py-[5px] pl-2 pr-[11px] text-[11px] font-bold text-primary-foreground">
                <Check className="size-3.5" strokeWidth={3} />
                Съедено
              </span>
            )}
          </span>
        </span>

        <span className="absolute inset-x-3.5 bottom-3 line-clamp-2 break-words font-heading text-[21px] font-bold leading-[1.1] text-white drop-shadow">
          {meal.title}
        </span>
      </Link>

      <div className="flex items-center justify-between gap-3 px-[15px] py-[13px]">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <CookingMethodBadges methods={meal.cookingMethods} max={3} />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!meal.isEaten && onEat && (
            <Button
              type="button"
              variant="accent"
              size="sm"
              loading={eatPending}
              icon={<Utensils className="size-[15px]" strokeWidth={2.2} />}
              onClick={onEat}
              className="rounded-full px-[17px] text-[13px] font-bold shadow-accent-glow"
            >
              Скушал
            </Button>
          )}
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
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-bold uppercase tracking-[0.05em] text-nav-inactive">
          {slotName}
        </span>
        <span className="mt-0.5 block font-heading text-[17px] font-bold leading-[1.1] text-foreground">
          Добавить рецепт
        </span>
      </span>
    </button>
  );
}
