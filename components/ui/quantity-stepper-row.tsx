"use client";

import { Stepper } from "@/components/ui/stepper";
import type { Unit } from "@/lib/types";
import { formatQuantity, QUANTITY_STEP_BY_UNIT } from "@/lib/units";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  unit: Unit;
  value: number;
  onChange: (value: number) => void;
  /** Цвет точки-маркера слева (bg-accent, bg-success-dot и т.п.). */
  dotClassName: string;
  /** Приглушить и зачеркнуть название при нуле — позиция пропускается. */
  strikeZero?: boolean;
};

/** Строка правки количества в шитах (списание после "скушано", перенос купленного в запасы). */
export function QuantityStepperRow({ name, unit, value, onChange, dotClassName, strikeZero }: Props) {
  const struck = strikeZero === true && value <= 0;
  return (
    <div className="flex items-center justify-between gap-2.5 border-b border-secondary px-[15px] py-[11px] last:border-b-0">
      <span className="flex min-w-0 items-center gap-2.5">
        <span className={cn("size-2 shrink-0 rounded-full", dotClassName)} />
        <span
          className={cn(
            "truncate text-sm font-semibold",
            struck ? "text-nav-inactive line-through" : "text-foreground",
          )}
        >
          {name}
        </span>
      </span>
      <Stepper
        value={value}
        onValueChange={onChange}
        min={0}
        max={99000}
        step={QUANTITY_STEP_BY_UNIT[unit]}
        formatValue={(quantity) => formatQuantity(quantity, unit)}
        size="iconSm"
        label={`Количество: ${name}`}
        className="shrink-0 gap-2"
      />
    </div>
  );
}
