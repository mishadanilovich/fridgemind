"use client";

import { X } from "lucide-react";
import { useState, useTransition } from "react";

import { SheetHandle } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { removeMeal } from "@/lib/actions/menu";
import { cn } from "@/lib/utils";

type Props = {
  mealId: string;
  recipeTitle: string;
  slotName: string;
  isEaten: boolean;
  className?: string;
};

export function RemoveMealButton({ mealId, recipeTitle, slotName, isEaten, className }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await removeMeal(mealId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setError(null);
      }}
    >
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={`Убрать «${recipeTitle}» из слота «${slotName}»`}
          className={cn(
            "pressable flex size-[22px] items-center justify-center rounded-xs bg-foreground/65 text-background backdrop-blur-sm",
            className,
          )}
        >
          <X className="size-3.5" strokeWidth={2.4} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        hideClose
        className="rounded-t-sheet border-0 bg-background px-5 pb-7 pt-3.5"
      >
        <SheetHandle />
        <SheetTitle className="font-heading text-[19px] font-bold text-foreground">
          Убрать рецепт?
        </SheetTitle>
        <SheetDescription className="mb-[18px] mt-1 text-sm font-medium text-foreground/70">
          «<b className="text-foreground">{recipeTitle}</b>» пропадёт из слота «{slotName}», и его
          можно будет назначить заново.
          {isEaten && " Приём пищи уже отмечен «скушано» — списанные запасы не вернутся."}
        </SheetDescription>
        {error && <p className="mb-3 text-sm font-medium text-destructive">{error}</p>}
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
            Убрать
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
