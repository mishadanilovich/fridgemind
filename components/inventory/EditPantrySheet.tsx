"use client";

import { useActionState, useEffect, useState, useTransition } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { QuantityInput } from "@/components/ui/quantity-input";
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
  const [confirmingDelete, setConfirmingDelete] = useState(false);
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

  const error = confirmingDelete ? deleteError : state.error;

  return (
    <BottomSheet
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      eyebrow={confirmingDelete ? undefined : "Изменить продукт"}
      title={confirmingDelete ? "Удалить из запасов?" : item.ingredient.name}
      description={
        confirmingDelete
          ? `«${item.ingredient.name}» пропадёт из домашних запасов.`
          : undefined
      }
    >
      <FormErrorBanner message={error} />

      {confirmingDelete ? (
        <div className="flex gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="block"
            onClick={() => setConfirmingDelete(false)}
            className="flex-1 bg-card font-bold text-primary"
          >
            Отмена
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="block"
            loading={isDeleting}
            onClick={onDelete}
            className="flex-1 font-bold"
          >
            Удалить
          </Button>
        </div>
      ) : (
        <form action={formAction}>
          <input type="hidden" name="pantryItemId" value={item.id} />

          <QuantityInput
            name="quantity"
            value={qty}
            onChange={setQty}
            unitLabel={DISPLAY_UNIT_LABEL[item.unit]}
            error={state.fieldErrors?.quantity}
          />

          <div className="mt-5 flex gap-2.5">
            <Button
              type="button"
              variant="destructiveMuted"
              size="block"
              onClick={() => setConfirmingDelete(true)}
              className="shrink-0 font-bold"
            >
              Удалить
            </Button>
            <Button type="submit" size="block" loading={isPending} className="flex-1 font-bold">
              Сохранить
            </Button>
          </div>
        </form>
      )}
    </BottomSheet>
  );
}
