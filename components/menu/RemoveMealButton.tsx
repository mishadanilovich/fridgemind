"use client";

import { X } from "lucide-react";

import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { removeMeal } from "@/lib/actions/menu";
import { cn } from "@/lib/utils";

type Props = {
  mealId: string;
  recipeTitle: string;
  slotName: string;
  isEaten: boolean;
  className?: string;
};

export function RemoveMealButton({ mealId, recipeTitle, slotName, isEaten, className }: Props) {
  return (
    <ConfirmSheet
      title="Убрать рецепт?"
      confirmLabel="Убрать"
      onConfirm={() => removeMeal(mealId)}
      description={
        <>
          «<b className="text-foreground">{recipeTitle}</b>» пропадёт из слота «{slotName}», и его
          можно будет назначить заново.
          {isEaten && " Приём пищи уже отмечен «скушано» — списанные запасы не вернутся."}
        </>
      }
      trigger={
        <button
          type="button"
          aria-label={`Убрать «${recipeTitle}» из слота «${slotName}»`}
          className={cn(
            "pressable flex size-[22px] items-center justify-center rounded-xs bg-foreground/65 text-background backdrop-blur-sm",
            className,
          )}
        >
          <X className="size-3.5" strokeWidth={2.4} />
        </button>
      }
    />
  );
}
