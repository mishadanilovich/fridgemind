"use client";

import { useActionState, useEffect, useState, useTransition } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { QuantityInput } from "@/components/ui/quantity-input";
import { deleteShoppingItem, updateShoppingItem } from "@/lib/actions/shopping-list";
import { initialFormState } from "@/lib/form-state";
import type { ShoppingItemView, Unit } from "@/lib/types";
import { DISPLAY_UNIT_LABEL } from "@/lib/units";

import { ManualItemFields } from "./ManualItemFields";

type Props = {
  item: ShoppingItemView;
  onClose: () => void;
};

/**
 * Редактирование позиции прямо в списке (см. CLAUDE.md §6): у ручных — название, количество,
 * единица и удаление; у позиций из меню — только количество (название/единица из справочника,
 * а удалять их бессмысленно — синхронизация с меню пересоздаст).
 */
export function EditShoppingItemSheet({ item, onClose }: Props) {
  const [state, formAction, isPending] = useActionState(updateShoppingItem, initialFormState);
  const [qty, setQty] = useState(String(item.quantity));
  const [unit, setUnit] = useState<Unit>(item.unit);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  useEffect(() => {
    if (state.data) onClose();
  }, [state, onClose]);

  function onDelete() {
    setDeleteError(null);
    startDelete(async () => {
      const result = await deleteShoppingItem(item.id);
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
      eyebrow={confirmingDelete ? undefined : "Изменить позицию"}
      title={confirmingDelete ? "Удалить из списка?" : item.name}
      description={confirmingDelete ? `«${item.name}» пропадёт из списка покупок.` : undefined}
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
          <input type="hidden" name="itemId" value={item.id} />

          <div className="space-y-3">
            {item.isManual ? (
              <ManualItemFields
                nameDefault={state.values?.name ?? item.name}
                nameError={state.fieldErrors?.name}
                qty={qty}
                onQtyChange={setQty}
                qtyError={state.fieldErrors?.quantity}
                unit={unit}
                onUnitChange={setUnit}
              />
            ) : (
              <QuantityInput
                name="quantity"
                value={qty}
                onChange={setQty}
                unitLabel={DISPLAY_UNIT_LABEL[item.unit]}
                error={state.fieldErrors?.quantity}
              />
            )}
          </div>

          <div className="mt-5 flex gap-2.5">
            {item.isManual && (
              <Button
                type="button"
                variant="destructiveMuted"
                size="block"
                onClick={() => setConfirmingDelete(true)}
                className="shrink-0 font-bold"
              >
                Удалить
              </Button>
            )}
            <Button type="submit" size="block" loading={isPending} className="flex-1 font-bold">
              Сохранить
            </Button>
          </div>
        </form>
      )}
    </BottomSheet>
  );
}
