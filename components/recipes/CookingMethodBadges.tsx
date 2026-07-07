import { Badge } from "@/components/ui/badge";
import { COOKING_METHOD_ICONS, COOKING_METHOD_LABELS } from "@/lib/cooking-methods";
import type { CookingMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  methods: CookingMethod[];
  // "icon" — компактные значки для карточек; "pill" — значок + подпись для просмотра рецепта.
  variant?: "icon" | "pill";
  className?: string;
};

function tone(method: CookingMethod): "success" | "warm" {
  return method === "NO_COOK" ? "success" : "warm";
}

export function CookingMethodBadges({ methods, variant = "icon", className }: Props) {
  if (methods.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {methods.map((method) => {
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
              "flex size-6 items-center justify-center rounded-[7px] border",
              tone(method) === "success"
                ? "border-success-border bg-success text-success-foreground"
                : "border-badge-border bg-badge text-badge-foreground",
            )}
          >
            <Icon className="size-3.5" />
          </span>
        );
      })}
    </div>
  );
}
