import { COOKING_METHOD_ICONS, COOKING_METHOD_LABELS } from "@/lib/cooking-methods";
import type { CookingMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  methods: CookingMethod[];
  // "icon" — компактные значки для карточек; "pill" — значок + подпись для просмотра рецепта.
  variant?: "icon" | "pill";
  className?: string;
};

function toneClass(method: CookingMethod): string {
  return method === "NO_COOK"
    ? "bg-success text-success-foreground border-success-border"
    : "bg-badge text-badge-foreground border-badge-border";
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
            <span
              key={method}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                toneClass(method),
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </span>
          );
        }
        return (
          <span
            key={method}
            title={label}
            className={cn(
              "flex size-6 items-center justify-center rounded-[7px] border",
              toneClass(method),
            )}
          >
            <Icon className="size-3.5" />
          </span>
        );
      })}
    </div>
  );
}
