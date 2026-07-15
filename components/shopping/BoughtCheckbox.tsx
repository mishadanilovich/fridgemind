import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  isBought: boolean;
  /** Без обработчика — статичная отметка (офлайн-просмотр списка). */
  onToggle?: () => void;
  label?: string;
};

/** Квадратная галочка "куплено" — общая для списка покупок и его офлайн-просмотра. */
export function BoughtCheckbox({ isBought, onToggle, label }: Props) {
  const className = cn(
    "flex size-6 shrink-0 items-center justify-center rounded-xs border-2",
    isBought ? "border-primary bg-primary" : "border-tan-dashed bg-transparent",
  );
  const mark = isBought && (
    <Check className="size-3.5 text-primary-foreground" strokeWidth={3.2} />
  );

  if (!onToggle) return <span className={className}>{mark}</span>;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isBought}
      aria-label={label}
      onClick={onToggle}
      className={cn("pressable", className)}
    >
      {mark}
    </button>
  );
}
