"use client";

import { Heart } from "lucide-react";
import { useOptimistic, useTransition } from "react";

import { toggleRecipeFavorite } from "@/lib/actions/recipes";
import { callAction } from "@/lib/form-state";
import { cn } from "@/lib/utils";

type Props = {
  recipeId: string;
  isFavorite: boolean;
  title: string;
  /** card — сердечко в мета-строке карточки, overlay — кружок поверх обложки рецепта. */
  variant?: "card" | "overlay";
  onError: (message: string | null) => void;
};

export function FavoriteButton({
  recipeId,
  isFavorite,
  title,
  variant = "card",
  onError,
}: Props) {
  const [, startToggle] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(isFavorite);

  function toggle() {
    onError(null);
    if (!navigator.onLine) {
      onError("Нет сети — избранное не сохранится. Попробуйте, когда появится соединение.");
      return;
    }
    const next = !optimistic;
    startToggle(async () => {
      setOptimistic(next);
      const result = await callAction(() => toggleRecipeFavorite(recipeId, next));
      if (result.error !== null) onError(result.error);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={optimistic}
      aria-label={optimistic ? `Убрать «${title}» из избранного` : `Добавить «${title}» в избранное`}
      className={cn(
        "pressable flex shrink-0 items-center justify-center",
        variant === "card"
          ? "-my-1 -mr-0.5 size-[30px]"
          : "size-10 rounded-full bg-background/90 backdrop-blur",
      )}
    >
      <Heart
        className={cn(
          variant === "card" ? "size-5" : "size-[21px]",
          optimistic ? "fill-accent text-accent" : "text-muted-foreground",
        )}
        strokeWidth={1.9}
      />
    </button>
  );
}
