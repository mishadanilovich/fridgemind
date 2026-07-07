import { CookingPot, Pencil } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RecipeCardView } from "@/lib/types";
import { cn } from "@/lib/utils";

import { CookingMethodBadges } from "./CookingMethodBadges";
import { DeleteRecipeButton } from "./DeleteRecipeButton";

type Props = {
  recipe: RecipeCardView;
  canEdit: boolean;
};

export function RecipeCard({ recipe, canEdit }: Props) {
  const { id, title, photoUrl, cookTimeMinutes, cookingMethods, matchHave, matchTotal } = recipe;
  const meta = cookTimeMinutes ? `~${cookTimeMinutes} мин` : "Рецепт";
  const allInStock = matchTotal > 0 && matchHave === matchTotal;

  return (
    <div className="mb-3 flex gap-3 rounded-[20px] border border-border bg-card p-[11px] shadow-[0_8px_20px_-18px_rgba(45,32,18,0.5)]">
      <Link href={`/recipes/${id}`} className="flex min-w-0 flex-1 gap-3">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- next/image + Supabase remotePatterns подключим в этапе 4b
          <img
            src={photoUrl}
            alt={title}
            loading="lazy"
            className="size-[82px] shrink-0 rounded-[15px] object-cover"
          />
        ) : (
          <div className="flex size-[82px] shrink-0 items-center justify-center rounded-[15px] bg-secondary text-muted-foreground">
            <CookingPot className="size-8" />
          </div>
        )}
        <div className="flex min-w-0 flex-col justify-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            {meta}
          </div>
          <div className="mb-2 mt-[3px] line-clamp-2 font-heading text-[18px] font-semibold leading-[1.12] text-foreground">
            {title}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {matchTotal > 0 && (
              <Badge variant={allInStock ? "success" : "warm"} size="md" className="font-bold">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    allInStock ? "bg-success-foreground" : "bg-badge-foreground",
                  )}
                />
                {matchHave}/{matchTotal} есть
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
            size="icon"
            className="size-[34px] rounded-[10px]"
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
