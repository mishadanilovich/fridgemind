import type { MenuMealView, MenuSlotView } from "./types";

type SlotRef = { id: string; name: string };

/** Приём пищи вместе со слотом, в который он назначен (слот мог быть уже soft-deleted). */
export type DayMeal = { slotId: string; slotName: string; meal: MenuMealView };

// Слоты дня в порядке household'а. Приёмы пищи, чей слот удалён (soft-delete, см. CLAUDE.md §5),
// показываются после активных — запись существует и участвует в списке покупок, поэтому прятать
// её нельзя, но и предлагать этот слот для новых назначений уже незачем.
// Участник (canEdit = false) пустых слотов не видит вовсе — назначить рецепт он всё равно не может.
export function buildDaySlots(
  slots: SlotRef[],
  meals: DayMeal[],
  canEdit: boolean,
): MenuSlotView[] {
  const mealBySlot = new Map(meals.map((m) => [m.slotId, m]));
  const activeIds = new Set(slots.map((s) => s.id));

  const views: MenuSlotView[] = slots.map((slot) => ({
    slotId: slot.id,
    slotName: slot.name,
    meal: mealBySlot.get(slot.id)?.meal ?? null,
  }));

  for (const { slotId, slotName, meal } of meals) {
    if (!activeIds.has(slotId)) views.push({ slotId, slotName, meal });
  }

  return canEdit ? views : views.filter((view) => view.meal !== null);
}

export function countMeals(slots: MenuSlotView[]): { planned: number; eaten: number } {
  const planned = slots.filter((slot) => slot.meal !== null);
  return {
    planned: planned.length,
    eaten: planned.filter((slot) => slot.meal?.isEaten).length,
  };
}
