"use client";

import { Plus, ShoppingBasket } from "lucide-react";
import { type ReactNode, useState } from "react";

import { CategoryDot } from "@/components/inventory/CategoryDot";
import { EmptyState } from "@/components/ui/empty-state";
import { addDaysIso, weekDatesIso } from "@/lib/dates";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/product-categories";
import { buildShoppingGroups } from "@/lib/shopping-list";
import type { ShoppingItemView } from "@/lib/types";
import { formatQuantity } from "@/lib/units";
import { cn } from "@/lib/utils";

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

export function ShoppingListBoard({ items, today, weekStart }: Props) {
  const [filter, setFilter] = useState<DayFilter>({ kind: "week" });
  const [pickingDays, setPickingDays] = useState(false);
  const [adding, setAdding] = useState(false);

  const weekDays = weekDatesIso(weekStart);
  // В воскресенье "завтра" — уже следующая неделя, чип не показывается.
  const hasTomorrow = weekDays.includes(addDaysIso(today, 1));

  const days = selectedDays(filter, today);
  const groups = buildShoppingGroups(items, days);

  return (
    <>
      <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip active={filter.kind === "today"} onClick={() => setFilter({ kind: "today" })}>
          Сегодня
        </Chip>
        {hasTomorrow && (
          <Chip
            active={filter.kind === "tomorrow"}
            onClick={() => setFilter({ kind: "tomorrow" })}
          >
            Завтра
          </Chip>
        )}
        <Chip active={filter.kind === "week"} onClick={() => setFilter({ kind: "week" })}>
          Вся неделя
        </Chip>
        <Chip active={filter.kind === "custom"} onClick={() => setPickingDays(true)}>
          {filter.kind === "custom" ? `Выбраны дни · ${filter.days.length}` : "Выбрать дни"}
        </Chip>
      </div>

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
          <section key={group.category} className="mb-[18px]">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[13px] font-bold text-foreground">
                {PRODUCT_CATEGORY_LABELS[group.category]}
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {group.items.length}
              </span>
            </div>
            <div className="overflow-hidden rounded-card border border-border bg-card">
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
            </div>
          </section>
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

type ChipProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
};

function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "pressable shrink-0 whitespace-nowrap rounded-full border px-[15px] py-[9px] text-[13px] font-bold",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground",
      )}
    >
      {children}
    </button>
  );
}
