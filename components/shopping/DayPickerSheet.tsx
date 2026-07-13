"use client";

import { useEffect, useState } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDayTitle } from "@/lib/dates";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekDays: string[];
  /** Текущий выбор — предзаполняет чекбоксы при открытии. */
  initial: string[];
  onApply: (days: string[]) => void;
};

export function DayPickerSheet({ open, onOpenChange, weekDays, initial, onApply }: Props) {
  const [picked, setPicked] = useState<string[]>(initial);

  useEffect(() => {
    if (open) setPicked(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- сброс только при открытии шита
  }, [open]);

  function toggle(day: string) {
    setPicked((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day],
    );
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Выбрать дни"
      description="Количества пересчитаются под выбранные дни недели."
    >
      <div className="overflow-hidden rounded-card border border-border bg-card">
        {weekDays.map((day) => (
          <label
            key={day}
            className="flex cursor-pointer items-center justify-between border-b border-secondary px-[15px] py-3 last:border-b-0"
          >
            <span className="text-[14.5px] font-semibold text-foreground">
              {formatDayTitle(day)}
            </span>
            <Checkbox
              checked={picked.includes(day)}
              onCheckedChange={() => toggle(day)}
              className="size-6 rounded-lg"
            />
          </label>
        ))}
      </div>

      <Button
        type="button"
        size="block"
        disabled={picked.length === 0}
        onClick={() => {
          // Дни — в порядке недели, а не в порядке кликов: от этого зависит подпись чипа и стабильность пересчёта.
          onApply(weekDays.filter((day) => picked.includes(day)));
          onOpenChange(false);
        }}
        className="mt-5 w-full font-bold"
      >
        Показать список
      </Button>
    </BottomSheet>
  );
}
