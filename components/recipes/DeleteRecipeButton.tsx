"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { deleteRecipe, getRecipeUsage } from "@/lib/actions/recipes";

type Props = {
  recipeId: string;
  name: string;
  redirectToList?: boolean;
};

// Явные статусы вместо number|null: и "ещё грузится", и "не удалось проверить" должны
// показывать более строгое предупреждение по умолчанию, а не молча трактоваться как "не используется".
type UsageState = { status: "loading" } | { status: "ready"; count: number } | { status: "error" };

export function DeleteRecipeButton({ recipeId, name, redirectToList }: Props) {
  const router = useRouter();
  const [usage, setUsage] = useState<UsageState>({ status: "loading" });

  // Пока не подтверждено, что рецепт нигде не используется, — предполагаем худшее и показываем
  // более строгий текст предупреждения (safe default), а не "если был там запланирован".
  const definitelyUnused = usage.status === "ready" && usage.count === 0;

  return (
    <ConfirmSheet
      icon={Trash2}
      title="Удалить рецепт?"
      confirmLabel="Удалить"
      onOpen={() => {
        setUsage({ status: "loading" });
        getRecipeUsage(recipeId)
          .then((count) => setUsage({ status: "ready", count }))
          .catch(() => setUsage({ status: "error" }));
      }}
      onConfirm={() => deleteRecipe(recipeId)}
      onConfirmed={() => {
        if (redirectToList) router.push("/recipes");
      }}
      description={
        <>
          «<b className="text-foreground">{name}</b>» пропадёт из списка рецептов
          {!definitelyUnused && " и будет убран из запланированных приёмов пищи в меню"}. Уже
          отмеченные «скушано» приёмы пищи останутся в истории.
        </>
      }
      trigger={
        <Button variant="destructiveMuted" size="iconSm" aria-label={`Удалить «${name}»`}>
          <Trash2 />
        </Button>
      }
    />
  );
}
