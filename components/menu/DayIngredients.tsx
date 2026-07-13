import { Badge } from "@/components/ui/badge";
import type { DayIngredientView } from "@/lib/shopping-list";
import { formatQuantity } from "@/lib/units";
import { cn } from "@/lib/utils";

type Props = {
  ingredients: DayIngredientView[];
};

/** Ингредиенты всех приёмов пищи дня с отметкой "есть дома"/"нужно купить" (MVP-пункт 6). */
export function DayIngredients({ ingredients }: Props) {
  if (ingredients.length === 0) return null;

  const missing = ingredients.filter((ing) => !ing.enough).length;

  return (
    <section className="mt-7">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[13px] font-bold text-foreground">Ингредиенты на день</span>
        <span
          className={cn(
            "text-[11px] font-bold",
            missing > 0 ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {missing > 0 ? `нужно купить: ${missing}` : "всё есть дома"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {ingredients.map((ing) => (
          <Badge
            key={ing.ingredientId}
            variant={ing.enough ? "chip" : "warning"}
            size="lg"
          >
            <span
              className={cn("size-1.5 rounded-full", ing.enough ? "bg-primary" : "bg-accent")}
            />
            {ing.name} · {formatQuantity(ing.needed, ing.unit)}
          </Badge>
        ))}
      </div>

      {missing > 0 && (
        <p className="mt-2.5 px-1 text-[12px] font-medium text-muted-foreground">
          Оранжевым — то, чего не хватает в запасах. Недостающее уже учтено в списке покупок.
        </p>
      )}
    </section>
  );
}
