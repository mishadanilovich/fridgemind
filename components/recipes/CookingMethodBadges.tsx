"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { COOKING_METHOD_ICONS, COOKING_METHOD_LABELS } from "@/lib/cooking-methods";
import type { CookingMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  methods: CookingMethod[];
  // "icon" — компактные значки для карточек; "pill" — значок + подпись для просмотра рецепта.
  variant?: "icon" | "pill";
  /** Максимум значков в "icon"-режиме: лишние сворачиваются в "+N" (тап по нему раскрывает остальные). */
  max?: number;
  className?: string;
};

function tone(method: CookingMethod): "success" | "warm" {
  return method === "NO_COOK" ? "success" : "warm";
}

export function CookingMethodBadges({ methods, variant = "icon", max, className }: Props) {
  const [expanded, setExpanded] = useState(false);
  if (methods.length === 0) return null;

  const collapse = variant === "icon" && max !== undefined && !expanded && methods.length > max;
  const visible = collapse ? methods.slice(0, max) : methods;
  const hidden = collapse ? methods.slice(max) : [];

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {visible.map((method) => {
        const Icon = COOKING_METHOD_ICONS[method];
        const label = COOKING_METHOD_LABELS[method];
        if (variant === "pill") {
          return (
            <Badge key={method} variant={tone(method)} size="md">
              <Icon className="size-3.5" />
              {label}
            </Badge>
          );
        }
        return (
          <span
            key={method}
            title={label}
            className={cn(
              "flex size-6 items-center justify-center rounded-xs border",
              tone(method) === "success"
                ? "border-success-border bg-success text-success-foreground"
                : "border-badge-border bg-badge text-badge-foreground",
            )}
          >
            <Icon className="size-3.5" />
          </span>
        );
      })}
      {hidden.length > 0 && (
        <button
          type="button"
          onClick={(e) => {
            // На тач-устройствах у span'а нет hover — title-подсказка никогда не всплывёт,
            // поэтому раскрываем остальные значки по тапу, а не полагаемся на нативный tooltip.
            e.preventDefault();
            e.stopPropagation();
            setExpanded(true);
          }}
          aria-label={`Ещё способы приготовления: ${hidden
            .map((method) => COOKING_METHOD_LABELS[method])
            .join(", ")}`}
          className="flex h-6 min-w-6 items-center justify-center rounded-xs border border-border bg-secondary px-1 text-[11px] font-bold text-muted-foreground"
        >
          +{hidden.length}
        </button>
      )}
    </div>
  );
}
