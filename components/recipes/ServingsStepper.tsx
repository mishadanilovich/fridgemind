"use client";

import { Minus, Plus } from "lucide-react";

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
        <button
          type="button"
          aria-label="Меньше"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex size-9 items-center justify-center rounded-[11px] border border-border bg-background text-primary disabled:opacity-40"
        >
          <Minus className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Больше"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex size-9 items-center justify-center rounded-[11px] border border-border bg-background text-primary disabled:opacity-40"
        >
          <Plus className="size-5" />
        </button>
      </div>
    </div>
  );
}
