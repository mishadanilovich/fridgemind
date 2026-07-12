"use client";

import { UtensilsCrossed } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import type { MenuDayView, MenuSlotView, PickerRecipeView } from "@/lib/types";

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
      {day.slots.map((slot) =>
        slot.meal ? (
          <MealCard
            key={slot.slotId}
            slotName={slot.slotName}
            meal={slot.meal}
            canEdit={canEdit}
          />
        ) : (
          <EmptySlotCard
            key={slot.slotId}
            slotName={slot.slotName}
            onPick={() => setPicking(slot)}
          />
        ),
      )}

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
    </>
  );
}
