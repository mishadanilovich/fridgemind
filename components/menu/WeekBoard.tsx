"use client";

import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { RecipePhoto } from "@/components/recipes/RecipePhoto";
import { todayIso, weekdayName, weekdayShort } from "@/lib/dates";
import type { MenuDayView, MenuSlotView, PickerRecipeView } from "@/lib/types";
import { cn } from "@/lib/utils";

import { RecipePickerSheet } from "./RecipePickerSheet";
import { RemoveMealButton } from "./RemoveMealButton";

type Props = {
  days: MenuDayView[];
  recipes: PickerRecipeView[];
  canEdit: boolean;
};

type Target = { date: string; slot: MenuSlotView };

export function WeekBoard({ days, recipes, canEdit }: Props) {
  const [picking, setPicking] = useState<Target | null>(null);
  const today = todayIso();

  return (
    <>
      {days.map((day) => (
        <WeekDayCard
          key={day.date}
          day={day}
          isToday={day.date === today}
          canEdit={canEdit}
          onPick={(slot) => setPicking({ date: day.date, slot })}
        />
      ))}

      <RecipePickerSheet
        date={picking?.date ?? today}
        slot={picking?.slot ?? null}
        recipes={recipes}
        onOpenChange={(open) => {
          if (!open) setPicking(null);
        }}
      />
    </>
  );
}

type DayProps = {
  day: MenuDayView;
  isToday: boolean;
  canEdit: boolean;
  onPick: (slot: MenuSlotView) => void;
};

function WeekDayCard({ day, isToday, canEdit, onPick }: DayProps) {
  return (
    <div className="mb-3 rounded-card border border-border bg-card px-[15px] py-3.5">
      <Link href={`/menu/${day.date}`} className="mb-2.5 flex items-center justify-between">
        <span className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-md font-heading text-sm font-extrabold",
              isToday ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground",
            )}
          >
            {weekdayShort(day.date)}
          </span>
          <span>
            <span className="block text-[15px] font-bold text-foreground">
              {weekdayName(day.date)}
            </span>
            {isToday && <span className="block text-[11px] font-bold text-accent">Сегодня</span>}
          </span>
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          Открыть день
          <ChevronRight className="size-4" />
        </span>
      </Link>

      {day.slots.length === 0 ? (
        <p className="px-0.5 pt-0.5 text-[12.5px] font-medium text-nav-inactive">
          Ничего не запланировано
        </p>
      ) : (
        // До трёх карточек видно сразу, остальные — свайпом внутри дня (см. CLAUDE.md §6).
        // Скролл идёт внутри паддингов карточки дня, а не встык с её краями.
        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {day.slots.map((slot) => (
            <SlotMiniCard
              key={slot.slotId}
              slot={slot}
              canEdit={canEdit}
              onPick={() => onPick(slot)}
              wide={day.slots.length <= 3}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type MiniProps = {
  slot: MenuSlotView;
  canEdit: boolean;
  onPick: () => void;
  /** Слоты помещаются в ряд — делим ширину поровну; иначе фиксируем ширину и листаем свайпом. */
  wide: boolean;
};

function SlotMiniCard({ slot, canEdit, onPick, wide }: MiniProps) {
  const { meal, slotName } = slot;
  const size = cn("h-[120px] shrink-0 snap-start", wide ? "flex-1 basis-0 min-w-0" : "w-[108px]");

  // Пустой слот сюда доходит только у Редактора/Организатора: кому его не видно, решает
  // buildDaySlots (lib/menu.ts) — второй проверки роли здесь быть не должно.
  if (!meal) {
    return (
      <button
        type="button"
        onClick={onPick}
        className={cn(
          size,
          "pressable flex flex-col items-center justify-center gap-1.5 rounded-md border-[1.5px] border-dashed border-tan-dashed p-1.5",
        )}
      >
        <span className="flex size-[26px] items-center justify-center rounded-full bg-secondary">
          <Plus className="size-[15px] text-nav-inactive" strokeWidth={2.4} />
        </span>
        <span className="line-clamp-1 text-[9px] font-bold uppercase tracking-[0.04em] text-nav-inactive">
          {slotName}
        </span>
      </button>
    );
  }

  return (
    <div className={cn(size, "relative overflow-hidden rounded-md border border-border bg-card")}>
      {canEdit && (
        <RemoveMealButton
          mealId={meal.id}
          recipeTitle={meal.title}
          slotName={slotName}
          isEaten={meal.isEaten}
          className="absolute right-[5px] top-[5px] z-10"
        />
      )}
      {/* flex-колонка, а не block: содержимое <button> браузер иначе центрирует по вертикали,
          и фото отходило от верхнего края карточки на несколько пикселей. */}
      <button
        type="button"
        onClick={onPick}
        disabled={!canEdit}
        className="flex size-full flex-col items-stretch p-0 text-left"
      >
        <RecipePhoto
          photoUrl={meal.photoUrl}
          width={120}
          height={48}
          className="h-12 w-full"
          iconClassName="size-5"
        />
        <span className="block px-[7px] pb-[7px] pt-[5px]">
          <span className="block truncate text-[9px] font-bold uppercase tracking-[0.04em] text-muted-foreground">
            {slotName}
          </span>
          <span className="mt-px line-clamp-2 break-words text-[11px] font-semibold leading-[1.15] text-foreground">
            {meal.title}
          </span>
          <span className="mt-0.5 block text-[9px] font-bold text-muted-foreground">
            {meal.servings} порц.{meal.isEaten && " · съедено"}
          </span>
        </span>
      </button>
    </div>
  );
}
