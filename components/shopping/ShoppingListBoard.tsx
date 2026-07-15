"use client";

import { Plus, Refrigerator, ShoppingBasket } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";

import { CategoryDot } from "@/components/inventory/CategoryDot";
import { CategorySection } from "@/components/ui/category-section";
import { EmptyState } from "@/components/ui/empty-state";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toggleShoppingItemBought } from "@/lib/actions/shopping-list";
import { addDaysIso, weekDatesIso } from "@/lib/dates";
import { buildShoppingGroups } from "@/lib/shopping-list";
import type { ShoppingItemView } from "@/lib/types";
import { formatQuantity } from "@/lib/units";
import { cn } from "@/lib/utils";

import { AddShoppingItemSheet } from "./AddShoppingItemSheet";
import { BoughtCheckbox } from "./BoughtCheckbox";
import { BulkPantrySheet } from "./BulkPantrySheet";
import { DayPickerSheet } from "./DayPickerSheet";
import { EditShoppingItemSheet } from "./EditShoppingItemSheet";

type Props = {
  items: ShoppingItemView[];
  today: string;
  weekStart: string;
};

// Фильтр по дням (см. CLAUDE.md §6): по умолчанию вся неделя, "custom" — выбор из 7 дней.
type DayFilter =
  | { kind: "week" }
  | { kind: "today" }
  | { kind: "tomorrow" }
  | { kind: "custom"; days: string[] };

function selectedDays(filter: DayFilter, today: string): string[] | null {
  switch (filter.kind) {
    case "week":
      return null;
    case "today":
      return [today];
    case "tomorrow":
      return [addDaysIso(today, 1)];
    case "custom":
      return filter.days;
  }
}

const CHIP_CLASS = "shrink-0 whitespace-nowrap px-[15px] py-[9px] font-bold";

export function ShoppingListBoard({ items, today, weekStart }: Props) {
  const [filter, setFilter] = useState<DayFilter>({ kind: "week" });
  const [pickingDays, setPickingDays] = useState(false);
  const [adding, setAdding] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [editing, setEditing] = useState<ShoppingItemView | null>(null);
  const [boughtError, setBoughtError] = useState<string | null>(null);
  const [, startToggle] = useTransition();

  // Optimistic-отметка "куплено": галочка меняется мгновенно (в магазине их ставят одну за
  // другой), сервер подтверждает следом через revalidatePath; при ошибке состояние само
  // откатывается к серверному, а причина показывается баннером.
  const [optimisticItems, applyBought] = useOptimistic(
    items,
    (state, next: { id: string; isBought: boolean }) =>
      state.map((item) =>
        item.id === next.id ? { ...item, isBought: next.isBought } : item,
      ),
  );

  function onToggleBought(item: ShoppingItemView) {
    setBoughtError(null);
    // Без сети отметка не буферизуется (офлайн — только чтение, см. CLAUDE.md §7): честнее
    // сразу сказать об этом, чем показать галочку, которая молча откатится.
    if (!navigator.onLine) {
      setBoughtError("Нет сети — отметка не сохранится. Попробуйте, когда появится соединение.");
      return;
    }
    startToggle(async () => {
      applyBought({ id: item.id, isBought: !item.isBought });
      try {
        const result = await toggleShoppingItemBought({
          itemId: item.id,
          isBought: !item.isBought,
        });
        if (result.error !== null) setBoughtError(result.error);
      } catch {
        setBoughtError("Не удалось сохранить отметку — проверьте соединение.");
      }
    });
  }

  const weekDays = weekDatesIso(weekStart);
  // В воскресенье "завтра" — уже следующая неделя, чип не показывается.
  const hasTomorrow = weekDays.includes(addDaysIso(today, 1));

  const days = selectedDays(filter, today);
  const groups = buildShoppingGroups(optimisticItems, days);

  // Кандидаты на массовый перенос в запасы: куплено, ещё не перенесено, не ручное
  // (см. CLAUDE.md §6, поток "массовое обновление инвентаря").
  const pantryCandidates = optimisticItems.filter(
    (item) => item.isBought && !item.addedToPantry && !item.isManual,
  );

  // "Выбрать дни" не переключает фильтр напрямую — открывает шит, а к "custom" фильтр
  // переходит только после подтверждения в DayPickerSheet (см. onApply ниже).
  function onFilterChange(value: string) {
    if (!value) return;
    if (value === "custom") {
      setPickingDays(true);
      return;
    }
    setFilter({ kind: value as "today" | "tomorrow" | "week" });
  }

  return (
    <>
      <ToggleGroup
        type="single"
        variant="pill"
        size="pill"
        value={filter.kind}
        onValueChange={onFilterChange}
        className="-mx-5 mb-4 justify-start overflow-x-auto px-5 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ToggleGroupItem value="today" className={CHIP_CLASS}>
          Сегодня
        </ToggleGroupItem>
        {hasTomorrow && (
          <ToggleGroupItem value="tomorrow" className={CHIP_CLASS}>
            Завтра
          </ToggleGroupItem>
        )}
        <ToggleGroupItem value="week" className={CHIP_CLASS}>
          Вся неделя
        </ToggleGroupItem>
        <ToggleGroupItem value="custom" className={CHIP_CLASS}>
          {filter.kind === "custom" ? `Выбраны дни · ${filter.days.length}` : "Выбрать дни"}
        </ToggleGroupItem>
      </ToggleGroup>

      <FormErrorBanner message={boughtError} />

      {pantryCandidates.length > 0 && (
        <button
          type="button"
          onClick={() => setTransferring(true)}
          className="pressable mb-3 flex w-full items-center justify-center gap-2 rounded-card bg-primary px-4 py-[14px] text-sm font-bold text-primary-foreground shadow-primary-glow"
        >
          <Refrigerator className="size-[18px]" strokeWidth={2.2} />
          Добавить в запасы · {pantryCandidates.length}
        </button>
      )}

      <button
        type="button"
        onClick={() => setAdding(true)}
        className="pressable mb-[18px] flex w-full items-center justify-center gap-2 rounded-card border-[1.5px] border-dashed border-tan-dashed px-4 py-[13px] text-[13.5px] font-bold text-primary"
      >
        <Plus className="size-[18px]" strokeWidth={2.4} />
        Добавить свою позицию
      </button>

      {groups.length === 0 ? (
        <EmptyState
          icon={ShoppingBasket}
          title={optimisticItems.length === 0 ? "Список пока пуст" : "Всё уже есть дома"}
          description={
            optimisticItems.length === 0
              ? "Назначьте рецепты в меню недели — недостающие продукты появятся здесь сами."
              : "На выбранные дни докупать нечего."
          }
        />
      ) : (
        groups.map((group) => (
          <CategorySection key={group.category} category={group.category} count={group.items.length}>
            {group.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 border-b border-secondary px-[15px] py-[13px] last:border-b-0"
              >
                <BoughtCheckbox
                  isBought={item.isBought}
                  label={`Куплено: ${item.name}`}
                  onToggle={() => onToggleBought(item)}
                />

                <button
                  type="button"
                  onClick={() => setEditing(item)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2.5 text-left"
                  aria-label={`Изменить: ${item.name}`}
                >
                  <span className="min-w-0">
                    <span className="flex min-w-0 items-center gap-[11px]">
                      <CategoryDot category={item.category} />
                      <span
                        className={cn(
                          "truncate text-[14.5px] font-semibold",
                          item.isBought ? "text-nav-inactive line-through" : "text-foreground",
                        )}
                      >
                        {item.name}
                      </span>
                    </span>
                    {item.isBought && item.boughtByName && (
                      <span className="mt-0.5 block pl-[19px] text-[11px] font-semibold text-muted-foreground">
                        куплено · {item.boughtByName}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 font-heading text-[13.5px] font-bold text-muted-foreground">
                    {formatQuantity(item.needed, item.unit)}
                  </span>
                </button>
              </div>
            ))}
          </CategorySection>
        ))
      )}

      <DayPickerSheet
        open={pickingDays}
        onOpenChange={setPickingDays}
        weekDays={weekDays}
        initial={days ?? []}
        onApply={(picked) => setFilter({ kind: "custom", days: picked })}
      />
      <AddShoppingItemSheet open={adding} onOpenChange={setAdding} />
      <BulkPantrySheet
        open={transferring}
        onOpenChange={setTransferring}
        candidates={pantryCandidates}
      />
      {editing && <EditShoppingItemSheet item={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
