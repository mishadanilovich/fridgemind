"use client";

import { ChevronRight, CookingPot } from "lucide-react";
import { useState, useTransition } from "react";

import { CookingMethodBadges } from "@/components/recipes/CookingMethodBadges";
import { RecipePhoto } from "@/components/recipes/RecipePhoto";
import { ServingsStepper } from "@/components/recipes/ServingsStepper";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { assignMeal } from "@/lib/actions/menu";
import { formatDayTitle } from "@/lib/dates";
import type { MenuSlotView, PickerRecipeView } from "@/lib/types";

type Props = {
  date: string;
  /** Слот, в который выбираем рецепт; null — шторка закрыта. */
  slot: MenuSlotView | null;
  recipes: PickerRecipeView[];
  onOpenChange: (open: boolean) => void;
};

export function RecipePickerSheet({ date, slot, recipes, onOpenChange }: Props) {
  return (
    <BottomSheet
      open={slot !== null}
      onOpenChange={onOpenChange}
      title="Выбрать рецепт"
      description={slot ? `${slot.slotName} · ${formatDayTitle(date)}` : undefined}
    >
      {slot && (
        <PickerBody
          key={`${date}:${slot.slotId}`}
          date={date}
          slot={slot}
          recipes={recipes}
          onDone={() => onOpenChange(false)}
        />
      )}
    </BottomSheet>
  );
}

type BodyProps = {
  date: string;
  slot: MenuSlotView;
  recipes: PickerRecipeView[];
  onDone: () => void;
};

// Два шага: список рецептов → подтверждение с числом порций на этот день (см. макет
// "WEEK SLOT PICKER" и CLAUDE.md §5 "Порции").
function PickerBody({ date, slot, recipes, onDone }: BodyProps) {
  const [chosen, setChosen] = useState<PickerRecipeView | null>(null);
  const [servings, setServings] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Тот же рецепт, что уже стоит в слоте, открывается со своим числом порций; другой — с базовым.
  function choose(recipe: PickerRecipeView) {
    setChosen(recipe);
    setServings(
      slot.meal?.recipeId === recipe.id ? slot.meal.servings : recipe.baseServings,
    );
  }

  if (recipes.length === 0) {
    return (
      <EmptyState
        icon={CookingPot}
        title="Нет рецептов"
        description="Сначала добавьте рецепт — из рецептов и собирается меню на неделю."
      />
    );
  }

  if (!chosen) {
    return (
      <div className="-mx-1 max-h-[55vh] overflow-y-auto px-1">
        {recipes.map((recipe) => (
          <button
            key={recipe.id}
            type="button"
            onClick={() => choose(recipe)}
            className="pressable mb-2.5 flex w-full items-center gap-3 rounded-card border border-border bg-card p-[9px] text-left"
          >
            <RecipePhoto
              photoUrl={recipe.photoUrl}
              width={56}
              height={56}
              className="size-14 rounded-lg"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold leading-[1.1] text-foreground">
                {recipe.title}
              </span>
              <span className="mt-0.5 block text-[11.5px] font-semibold text-muted-foreground">
                {recipe.cookTimeMinutes ? `~${recipe.cookTimeMinutes} мин · ` : ""}
                {recipe.baseServings} порц.
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-nav-inactive" />
          </button>
        ))}
      </div>
    );
  }

  function onConfirm() {
    if (!chosen) return;
    setError(null);
    startTransition(async () => {
      const result = await assignMeal({
        date,
        mealSlotId: slot.slotId,
        recipeId: chosen.id,
        servings,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  return (
    <>
      <div className="mb-3.5 flex items-center gap-3 rounded-card border border-border bg-card p-3">
        <RecipePhoto
          photoUrl={chosen.photoUrl}
          width={64}
          height={64}
          className="size-16 rounded-lg"
        />
        <div className="min-w-0">
          <div className="truncate font-heading text-[17px] font-bold leading-[1.1] text-foreground">
            {chosen.title}
          </div>
          <div className="mt-1 flex items-center gap-2">
            {chosen.cookTimeMinutes && (
              <span className="text-xs font-semibold text-muted-foreground">
                ~{chosen.cookTimeMinutes} мин
              </span>
            )}
            <CookingMethodBadges methods={chosen.cookingMethods} />
          </div>
        </div>
      </div>

      <ServingsStepper
        label="Порции на этот день"
        value={servings}
        onChange={setServings}
        className="mb-4"
      />

      {error && <p className="mb-3 text-sm font-medium text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button variant="outline" size="block" onClick={() => setChosen(null)}>
          Назад
        </Button>
        <Button size="block" className="flex-1 font-bold" loading={isPending} onClick={onConfirm}>
          Добавить в день
        </Button>
      </div>
    </>
  );
}
