import { Pencil } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RecipeCardView } from "@/lib/types";
import { cn } from "@/lib/utils";

import { CookingMethodBadges } from "./CookingMethodBadges";
import { DeleteRecipeButton } from "./DeleteRecipeButton";
import { RecipePhoto } from "./RecipePhoto";

type Props = {
  recipe: RecipeCardView;
  canEdit: boolean;
};

export function RecipeCard({ recipe, canEdit }: Props) {
  const { id, title, photoUrl, cookTimeMinutes, cookingMethods, matchHave, matchTotal } = recipe;
  const meta = cookTimeMinutes ? `~${cookTimeMinutes} мин` : "Рецепт";
  const matchPct = matchTotal > 0 ? Math.round((matchHave / matchTotal) * 10) * 10 : 0;
  const allInStock = matchPct >= 100;

  return (
    <div className="mb-3 flex gap-3 rounded-card border border-border bg-card p-[11px] shadow-card">
      <Link href={`/recipes/${id}`} className="flex min-w-0 flex-1 gap-3">
        <RecipePhoto
          photoUrl={photoUrl}
          alt={title}
          width={82}
          height={82}
          className="size-[82px] rounded-lg"
          iconClassName="size-8"
        />
        <div className="flex min-w-0 flex-col justify-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            {meta}
          </div>
          <div className="mb-2 mt-[3px] line-clamp-2 font-heading text-[18px] font-semibold leading-[1.12] text-foreground">
            {title}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {matchTotal > 0 && (
              <Badge
                variant={matchPct >= 80 ? "success" : "warning"}
                size="md"
                className={cn("font-bold", allInStock && "text-primary")}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    allInStock ? "bg-primary" : matchPct >= 80 ? "bg-success-dot" : "bg-accent",
                  )}
                />
                {allInStock ? "Всё есть дома" : `${matchPct}% есть дома`}
              </Badge>
            )}
            <CookingMethodBadges methods={cookingMethods} />
          </div>
        </div>
      </Link>

      {canEdit && (
        <div className="flex shrink-0 flex-col justify-center gap-2">
          <Button
            asChild
            variant="outline"
            size="iconSm"
            className="bg-background text-primary"
            aria-label={`Изменить «${title}»`}
          >
            <Link href={`/recipes/${id}/edit`}>
              <Pencil />
            </Link>
          </Button>
          <DeleteRecipeButton recipeId={id} name={title} />
        </div>
      )}
    </div>
  );
}
