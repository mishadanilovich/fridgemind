"use client";

import { useMemo, useState, useTransition } from "react";

import { ServingsStepper } from "@/components/recipes/ServingsStepper";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { QuantityStepperRow } from "@/components/ui/quantity-stepper-row";
import { deductMealIngredients } from "@/lib/actions/meals";
import { scaleIngredient } from "@/lib/recipes";
import type { EatDeductionView } from "@/lib/types";
import { UNIT_TO_TYPE } from "@/lib/units";

type Props = {
  /** Payload из markMealEaten; null — шит закрыт. */
  deduction: EatDeductionView | null;
  onClose: () => void;
};

/**
 * Необязательный шит "Списать использованные продукты?" после отметки "скушано"
 * (см. CLAUDE.md §6): степпер порций пересчитывает все количества заново, кнопки ±
 * по ингредиенту правят итоговую цифру точечно. "Пропустить" ничего не меняет.
 */
export function EatSheet({ deduction, onClose }: Props) {
  return (
    <BottomSheet
      open={deduction !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      eyebrow="Отмечено съеденным"
      title={deduction?.recipeTitle ?? ""}
      description="Списать использованные продукты? Спишем из запасов ровно на приготовленное количество — можно поправить или пропустить."
    >
      {deduction && <EatSheetBody deduction={deduction} onClose={onClose} />}
    </BottomSheet>
  );
}

function scaledQuantities(deduction: EatDeductionView, servings: number): number[] {
  return deduction.ingredients.map((ingredient) =>
    scaleIngredient(
      ingredient.quantity,
      servings,
      deduction.baseServings,
      UNIT_TO_TYPE[ingredient.unit],
    ),
  );
}

function EatSheetBody({ deduction, onClose }: { deduction: EatDeductionView; onClose: () => void }) {
  const [servings, setServings] = useState(deduction.servings);
  const initial = useMemo(() => scaledQuantities(deduction, deduction.servings), [deduction]);
  const [quantities, setQuantities] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Смена порций пересчитывает все количества заново — точечные правки ± при этом
  // сбрасываются: новая пропорция важнее старых поправок.
  function onServingsChange(next: number) {
    setServings(next);
    setQuantities(scaledQuantities(deduction, next));
  }

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deductMealIngredients({
        mealId: deduction.mealId,
        servings,
        items: deduction.ingredients.map((ingredient, index) => ({
          ingredientId: ingredient.ingredientId,
          quantity: quantities[index],
        })),
      });
      if (result.error !== null) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <>
      <FormErrorBanner message={error} />

      <ServingsStepper
        label="Готовили порций"
        value={servings}
        onChange={onServingsChange}
        className="mb-3"
      />

      <div className="-mx-1 max-h-[38vh] overflow-y-auto px-1">
        <div className="rounded-card border border-border bg-card">
          {deduction.ingredients.map((ingredient, index) => (
            <QuantityStepperRow
              key={ingredient.ingredientId}
              name={ingredient.name}
              unit={ingredient.unit}
              value={quantities[index] ?? 0}
              onChange={(next) =>
                setQuantities((prev) => prev.map((q, i) => (i === index ? next : q)))
              }
              dotClassName="bg-accent"
            />
          ))}
        </div>
      </div>

      <div className="mt-5 flex gap-2.5">
        <Button
          type="button"
          variant="outline"
          size="block"
          onClick={onClose}
          className="flex-1 bg-card font-bold text-primary"
        >
          Пропустить
        </Button>
        <Button
          type="button"
          size="block"
          loading={isPending}
          onClick={onConfirm}
          className="flex-1 font-bold"
        >
          Списать
        </Button>
      </div>
    </>
  );
}
