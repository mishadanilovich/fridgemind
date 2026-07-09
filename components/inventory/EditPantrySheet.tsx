"use client";

import { useActionState, useEffect, useState, useTransition } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deletePantryItem, updatePantryItem } from "@/lib/actions/pantry";
import { initialFormState } from "@/lib/form-state";
import type { PantryItemView } from "@/lib/types";
import { DISPLAY_UNIT_LABEL } from "@/lib/units";

type Props = {
  item: PantryItemView;
  onClose: () => void;
};

export function EditPantrySheet({ item, onClose }: Props) {
  const [state, formAction, isPending] = useActionState(updatePantryItem, initialFormState);
  const [qty, setQty] = useState(String(item.quantity));
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  useEffect(() => {
    if (state.data) onClose();
  }, [state, onClose]);

  function onDelete() {
    setDeleteError(null);
    startDelete(async () => {
      const result = await deletePantryItem(item.id);
      if (result.error !== null) setDeleteError(result.error);
      else onClose();
    });
  }

  const error = state.error ?? deleteError;

  return (
    <BottomSheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      eyebrow="Изменить продукт"
      title={item.ingredient.name}
    >
      <form action={formAction}>
        <input type="hidden" name="pantryItemId" value={item.id} />

        {error && (
          <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <Input
            name="quantity"
            value={qty}
            onChange={(e) => setQty(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            placeholder="Кол-во"
            error={state.fieldErrors?.quantity}
            className="h-12 flex-1 rounded-lg text-center text-[15px] font-semibold"
          />
          <span className="w-[52px] shrink-0 text-center text-sm font-semibold text-muted-foreground">
            {DISPLAY_UNIT_LABEL[item.unit]}
          </span>
        </div>

        <div className="mt-5 flex gap-2.5">
          <Button
            type="button"
            variant="destructiveMuted"
            size="block"
            loading={isDeleting}
            onClick={onDelete}
            className="shrink-0 font-bold"
          >
            Удалить
          </Button>
          <Button type="submit" size="block" loading={isPending} className="flex-1 font-bold">
            Сохранить
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
