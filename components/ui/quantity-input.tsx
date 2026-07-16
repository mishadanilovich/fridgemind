"use client";

import { Input } from "@/components/ui/input";
import { sanitizeQuantityInput } from "@/lib/units";

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Подпись единицы справа от поля ("г"/"мл"/"шт"); "—", пока продукт не выбран. */
  unitLabel: string;
  name?: string;
  error?: string;
};

export function QuantityInput({ value, onChange, unitLabel, name, error }: Props) {
  return (
    <div className="flex items-center gap-2.5">
      <Input
        name={name}
        value={value}
        onChange={(e) => onChange(sanitizeQuantityInput(e.target.value))}
        inputMode="decimal"
        placeholder="Кол-во"
        error={error}
        className="h-12 flex-1 rounded-lg text-center text-base font-semibold"
      />
      <span className="w-[52px] shrink-0 text-center text-sm font-semibold text-muted-foreground">
        {unitLabel}
      </span>
    </div>
  );
}
