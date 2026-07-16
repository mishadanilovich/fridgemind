"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
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
import { type ActionResult, callAction } from "@/lib/form-state";

type Props = {
  /** Кнопка, открывающая шит (рендерится как SheetTrigger asChild). */
  trigger: ReactNode;
  title: string;
  /** Текст под заголовком — что именно произойдёт и что необратимо. */
  description: ReactNode;
  /** Иконка рядом с заголовком (например, корзина для удаления). */
  icon?: LucideIcon;
  confirmLabel: string;
  cancelLabel?: string;
  /** Действие подтверждения; { error } показывается в шите, успех — закрывает его. */
  onConfirm: () => Promise<ActionResult>;
  onConfirmed?: () => void;
  /** Вызывается при открытии — например, чтобы подгрузить, где рецепт используется. */
  onOpen?: () => void;
};

/** Нижний шит подтверждения необратимого действия (удалить рецепт, убрать рецепт из слота). */
export function ConfirmSheet({
  trigger,
  title,
  description,
  icon: Icon,
  confirmLabel,
  cancelLabel = "Отмена",
  onConfirm,
  onConfirmed,
  onOpen,
}: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onOpenChange(next: boolean) {
    setOpen(next);
    setError(null);
    if (next) onOpen?.();
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await callAction(onConfirm);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      onConfirmed?.();
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="bottom"
        hideClose
        className="rounded-t-sheet border-0 bg-background px-5 pb-7 pt-3.5"
      >
        <SheetHandle />
        <div className="mb-2 flex items-center gap-2.5">
          {Icon && (
            <span className="flex size-[38px] items-center justify-center rounded-sm bg-destructive/10 text-destructive">
              <Icon className="size-5" />
            </span>
          )}
          <SheetTitle className="min-w-0 break-words font-heading text-[19px] font-bold text-foreground">
            {title}
          </SheetTitle>
        </div>
        <SheetDescription className="mb-[18px] mt-0.5 break-words text-sm font-medium text-foreground/70">
          {description}
        </SheetDescription>
        {error && <p className="mb-3 text-sm font-medium text-destructive">{error}</p>}
        <div className="flex gap-3">
          <SheetClose asChild>
            <Button variant="outline" size="block" className="flex-1">
              {cancelLabel}
            </Button>
          </SheetClose>
          <Button
            variant="destructive"
            size="block"
            className="flex-1"
            loading={isPending}
            onClick={confirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
