"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Отображение значения (например, "1.5 кг"); по умолчанию — само число. */
  formatValue?: (value: number) => string;
  size?: "icon" | "iconSm";
  /** Подпись для screen reader'ов, например "Число порций". */
  label?: string;
  className?: string;
};

export function Stepper({
  value,
  onValueChange,
  min = 1,
  max = 99,
  step = 1,
  formatValue,
  size = "icon",
  label,
  className,
}: Props) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)} role="group" aria-label={label}>
      <Button
        type="button"
        variant="outline"
        size={size}
        aria-label="Уменьшить"
        disabled={value <= min}
        onClick={() => onValueChange(Math.max(min, value - step))}
      >
        <Minus />
      </Button>
      <span className="min-w-8 text-center text-base font-semibold tabular-nums" aria-live="polite">
        {formatValue ? formatValue(value) : value}
      </span>
      <Button
        type="button"
        variant="outline"
        size={size}
        aria-label="Увеличить"
        disabled={value >= max}
        onClick={() => onValueChange(Math.min(max, value + step))}
      >
        <Plus />
      </Button>
    </div>
  );
}
