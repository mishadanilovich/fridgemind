import { Pencil } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RecipeCardView } from "@/lib/types";
import { cn } from "@/lib/utils";

import { CookingMethodBadges } from "./CookingMethodBadges";
import { DeleteRecipeButton } from "./DeleteRecipeButton";
import { FavoriteButton } from "./FavoriteButton";
import { RecipePhoto } from "./RecipePhoto";

type Props = {
  recipe: RecipeCardView;
  canEdit: boolean;
  onFavoriteError: (message: string | null) => void;
};

export function RecipeCard({ recipe, canEdit, onFavoriteError }: Props) {
  const { id, title, photoUrl, cookTimeMinutes, cookingMethods, isFavorite, matchHave, matchTotal } =
    recipe;
  const meta = cookTimeMinutes ? `~${cookTimeMinutes} мин` : "Рецепт";
  const matchPct = matchTotal > 0 ? Math.round((matchHave / matchTotal) * 10) * 10 : 0;
  const allInStock = matchPct >= 100;

  return (
    <div className="relative mb-3 flex gap-3 rounded-card border border-border bg-card p-[11px] shadow-card">
      {/* Ссылка на весь размер карточки, а не обёртка вокруг содержимого: сердечко и кнопки
          правки — интерактивные элементы, вложить их в <a> нельзя. */}
      <Link href={`/recipes/${id}`} aria-label={title} className="absolute inset-0 rounded-card" />
      <RecipePhoto
        photoUrl={photoUrl}
        alt={title}
        width={82}
        height={82}
        className="size-[82px] rounded-lg"
        iconClassName="size-8"
      />
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
            {meta}
          </div>
          {canEdit && (
            <span className="relative">
              <FavoriteButton
                recipeId={id}
                isFavorite={isFavorite}
                title={title}
                onError={onFavoriteError}
              />
            </span>
          )}
        </div>
        <div className="mb-2 mt-[3px] line-clamp-2 break-words font-heading text-[18px] font-semibold leading-[1.12] text-foreground">
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
          <CookingMethodBadges methods={cookingMethods} max={3} />
        </div>
      </div>

      {canEdit && (
        <div className="relative flex shrink-0 flex-col justify-center gap-2">
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
