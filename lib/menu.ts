import { addDaysIso, weekDatesIso } from "./dates";
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

// ---------- Шаблоны меню (см. CLAUDE.md §5 "Шаблоны меню") ----------

/** Не более 4 шаблонов на household — лимит из CLAUDE.md, проверяется в saveMenuTemplate. */
export const MENU_TEMPLATE_LIMIT = 4;

export type TemplateMealDraft = {
  dayOfWeek: number;
  mealSlotId: string;
  recipeId: string;
  servings: number;
};

// Приёмы пищи недели → строки шаблона. dayOfWeek — позиция дня в неделе (0 = понедельник),
// та же индексация, что weekDatesIso: шаблон переносится по дню недели, а не по дате.
// Даты вне сохраняемой недели отбрасываются (защита — в норме их не бывает).
export function weekMealsToTemplateDrafts(
  meals: { dateIso: string; mealSlotId: string; recipeId: string; servings: number }[],
  weekStartIso: string,
): TemplateMealDraft[] {
  const dates = weekDatesIso(weekStartIso);
  return meals.flatMap((m) => {
    const dayOfWeek = dates.indexOf(m.dateIso);
    if (dayOfWeek < 0) return [];
    return [{ dayOfWeek, mealSlotId: m.mealSlotId, recipeId: m.recipeId, servings: m.servings }];
  });
}

export type TemplateApplication = {
  dateIso: string;
  mealSlotId: string;
  recipeId: string;
  servings: number;
};

// Строки шаблона → назначения на конкретную неделю. Пропускаются меали, чей слот или рецепт
// больше не активен (soft-deleted с момента сохранения шаблона), — без ошибки, просто не
// накатываются (см. CLAUDE.md §5, "Применение"). Перезаписываются только затронутые слоты;
// остальное в неделе решает вызывающий (upsert по дню+слоту, не полная замена недели).
export function resolveTemplateApplication(
  templateMeals: TemplateMealDraft[],
  activeSlotIds: Set<string>,
  activeRecipeIds: Set<string>,
  weekStartIso: string,
): TemplateApplication[] {
  return templateMeals.flatMap((m) => {
    if (m.dayOfWeek < 0 || m.dayOfWeek > 6) return [];
    if (!activeSlotIds.has(m.mealSlotId) || !activeRecipeIds.has(m.recipeId)) return [];
    return [
      {
        dateIso: addDaysIso(weekStartIso, m.dayOfWeek),
        mealSlotId: m.mealSlotId,
        recipeId: m.recipeId,
        servings: m.servings,
      },
    ];
  });
}
