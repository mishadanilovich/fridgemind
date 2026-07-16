"use client";

import { UtensilsCrossed } from "lucide-react";
import { useState, useTransition } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { markMealEaten } from "@/lib/actions/meals";
import { callAction } from "@/lib/form-state";
import type { EatDeductionView, MenuDayView, MenuSlotView, PickerRecipeView } from "@/lib/types";

import { EatSheet } from "./EatSheet";
import { EmptySlotCard, MealCard } from "./MealCard";
import { RecipePickerSheet } from "./RecipePickerSheet";

type Props = {
  day: MenuDayView;
  recipes: PickerRecipeView[];
  canEdit: boolean;
};

/** Слоты одного дня крупными карточками — экраны "Сегодня" и просмотра дня. */
export function DayBoard({ day, recipes, canEdit }: Props) {
  const [picking, setPicking] = useState<MenuSlotView | null>(null);
  const [deduction, setDeduction] = useState<EatDeductionView | null>(null);
  const [eatingMealId, setEatingMealId] = useState<string | null>(null);
  const [eatError, setEatError] = useState<string | null>(null);
  const [, startEat] = useTransition();

  // "Скушано" применяется сразу; шит списания открывается следом и необязателен
  // (см. CLAUDE.md §6, поток "отметил, что скушал").
  function onEat(mealId: string) {
    setEatError(null);
    setEatingMealId(mealId);
    startEat(async () => {
      const result = await callAction(() => markMealEaten(mealId));
      setEatingMealId(null);
      if (result.error !== null) {
        setEatError(result.error);
        return;
      }
      if (result.data && result.data.ingredients.length > 0) setDeduction(result.data);
    });
  }

  if (day.slots.length === 0) {
    return (
      <EmptyState
        icon={UtensilsCrossed}
        title="Ничего не запланировано"
        description={
          canEdit
            ? "Приёмы пищи настраиваются в профиле — добавьте слот, чтобы планировать день."
            : "Меню на этот день составят Организатор или Редактор."
        }
      />
    );
  }

  return (
    <>
      <FormErrorBanner message={eatError} />

      {day.slots.map((slot) => {
        const meal = slot.meal;
        return meal ? (
          <MealCard
            key={slot.slotId}
            slotName={slot.slotName}
            meal={meal}
            canEdit={canEdit}
            onEat={() => onEat(meal.id)}
            eatPending={eatingMealId === meal.id}
          />
        ) : (
          <EmptySlotCard
            key={slot.slotId}
            slotName={slot.slotName}
            onPick={() => setPicking(slot)}
          />
        );
      })}

      {canEdit && (
        <p className="mt-1.5 rounded-card border-[1.5px] border-dashed border-tan-dashed px-4 py-3.5 text-[13px] font-medium text-muted-foreground">
          Приёмы пищи и их порядок настраиваются в профиле.
        </p>
      )}

      <RecipePickerSheet
        date={day.date}
        slot={picking}
        recipes={recipes}
        onOpenChange={(open) => {
          if (!open) setPicking(null);
        }}
      />
      <EatSheet deduction={deduction} onClose={() => setDeduction(null)} />
    </>
  );
}
