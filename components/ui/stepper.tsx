"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Подпись для screen reader'ов, например "Число порций". */
  label?: string;
  className?: string;
};

export function Stepper({ value, onValueChange, min = 1, max = 99, label, className }: Props) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)} role="group" aria-label={label}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Уменьшить"
        disabled={value <= min}
        onClick={() => onValueChange(Math.max(min, value - 1))}
      >
        <Minus />
      </Button>
      <span className="min-w-8 text-center text-base font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Увеличить"
        disabled={value >= max}
        onClick={() => onValueChange(Math.min(max, value + 1))}
      >
        <Plus />
      </Button>
    </div>
  );
}
