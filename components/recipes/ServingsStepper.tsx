"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  className?: string;
};

export function ServingsStepper({
  label,
  value,
  onChange,
  min = 1,
  max = 99,
  suffix = "порц.",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-2xl border border-border bg-card px-[14px] py-[11px]",
        className,
      )}
    >
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
          {label}
        </div>
        <div className="font-heading text-lg font-bold text-foreground">
          {value} {suffix}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="iconSm"
          aria-label="Меньше"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="bg-background text-primary"
        >
          <Minus />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="iconSm"
          aria-label="Больше"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="bg-background text-primary"
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
