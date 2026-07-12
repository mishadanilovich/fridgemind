"use client";

import { Plus, ShoppingBasket } from "lucide-react";
import { useState } from "react";

import { CategoryDot } from "@/components/inventory/CategoryDot";
import { CategorySection } from "@/components/ui/category-section";
import { EmptyState } from "@/components/ui/empty-state";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { addDaysIso, weekDatesIso } from "@/lib/dates";
import { buildShoppingGroups } from "@/lib/shopping-list";
import type { ShoppingItemView } from "@/lib/types";
import { formatQuantity } from "@/lib/units";

import { AddShoppingItemSheet } from "./AddShoppingItemSheet";
import { DayPickerSheet } from "./DayPickerSheet";

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

  const weekDays = weekDatesIso(weekStart);
  // В воскресенье "завтра" — уже следующая неделя, чип не показывается.
  const hasTomorrow = weekDays.includes(addDaysIso(today, 1));

  const days = selectedDays(filter, today);
  const groups = buildShoppingGroups(items, days);

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
          title={items.length === 0 ? "Список пока пуст" : "Всё уже есть дома"}
          description={
            items.length === 0
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
                className="flex items-center justify-between gap-2.5 border-b border-secondary px-[15px] py-[13px] last:border-b-0"
              >
                <span className="flex min-w-0 items-center gap-[11px]">
                  <CategoryDot category={item.category} />
                  <span className="truncate text-[14.5px] font-semibold text-foreground">
                    {item.name}
                  </span>
                </span>
                <span className="shrink-0 font-heading text-[13.5px] font-bold text-muted-foreground">
                  {formatQuantity(item.needed, item.unit)}
                </span>
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
    </>
  );
}
