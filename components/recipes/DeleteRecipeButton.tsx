"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState<UsageState>({ status: "loading" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onOpenChange(next: boolean) {
    setOpen(next);
    setError(null);
    if (next) {
      setUsage({ status: "loading" });
      getRecipeUsage(recipeId)
        .then((count) => setUsage({ status: "ready", count }))
        .catch(() => setUsage({ status: "error" }));
    }
  }

  // Пока не подтверждено, что рецепт нигде не используется, — предполагаем худшее и показываем
  // более строгий текст предупреждения (safe default), а не "если был там запланирован".
  const definitelyUnused = usage.status === "ready" && usage.count === 0;

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteRecipe(recipeId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (redirectToList) router.push("/recipes");
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghostDestructive"
          size="iconSm"
          className="border border-destructive/20 bg-destructive/10"
          aria-label={`Удалить «${name}»`}
        >
          <Trash2 />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="gap-0 rounded-t-[28px] border-0 bg-background px-5 pb-7 pt-3.5 [&>button]:hidden"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[hsl(var(--nav-inactive))]" />
        <div className="mb-2 flex items-center gap-2.5">
          <span className="flex size-[38px] items-center justify-center rounded-[11px] bg-destructive/10 text-destructive">
            <Trash2 className="size-5" />
          </span>
          <SheetTitle className="font-heading text-[19px] font-bold text-foreground">
            Удалить рецепт?
          </SheetTitle>
        </div>
        <SheetDescription className="mb-[18px] mt-0.5 text-sm font-medium text-foreground/70">
          «<b className="text-foreground">{name}</b>» будет удалён без возможности восстановить.
          {!definitelyUnused &&
            " Он также пропадёт из меню на неделю и из истории приёмов пищи, включая уже отмеченные «скушано»."}
        </SheetDescription>
        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
        <div className="flex gap-3">
          <SheetClose asChild>
            <Button variant="outline" size="block" className="flex-1">
              Отмена
            </Button>
          </SheetClose>
          <Button
            variant="destructive"
            size="block"
            className="flex-1"
            loading={isPending}
            onClick={onConfirm}
          >
            Удалить
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
