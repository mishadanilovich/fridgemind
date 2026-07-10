"use client";

import { useActionState, useEffect, useState } from "react";

import { IngredientPicker } from "@/components/ingredients/IngredientPicker";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { QuantityInput } from "@/components/ui/quantity-input";
import { addPantryItem } from "@/lib/actions/pantry";
import { initialFormState } from "@/lib/form-state";
import type { Ingredient, Unit } from "@/lib/types";
import { DISPLAY_UNIT_LABEL, UNIT_TYPE_TO_UNIT } from "@/lib/units";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type PickedProduct = { id: string; name: string; unit: Unit };

export function AddPantrySheet({ open, onOpenChange }: Props) {
  // Ремоунт формы на каждое открытие: состояние useActionState переживает закрытие шита,
  // и без сброса ошибки прошлой попытки мелькали бы в следующей, несвязанной.
  const [formEpoch, setFormEpoch] = useState(0);
  useEffect(() => {
    if (open) setFormEpoch((n) => n + 1);
  }, [open]);

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Добавить продукт"
      description="Если продукт уже есть в запасах, количество сложится."
    >
      <AddPantryForm key={formEpoch} onSaved={() => onOpenChange(false)} />
    </BottomSheet>
  );
}

function AddPantryForm({ onSaved }: { onSaved: () => void }) {
  const [state, formAction, isPending] = useActionState(addPantryItem, initialFormState);
  const [product, setProduct] = useState<PickedProduct | null>(null);
  const [qty, setQty] = useState("");

  useEffect(() => {
    if (state.data) onSaved();
  }, [state, onSaved]);

  function onSelect(ingredient: Ingredient) {
    setProduct({
      id: ingredient.id,
      name: ingredient.name,
      unit: UNIT_TYPE_TO_UNIT[ingredient.defaultUnitType],
    });
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="ingredientId" value={product?.id ?? ""} />

      {state.error && (
        <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {state.error}
        </div>
      )}

      <IngredientPicker value={product} onSelect={onSelect} />
      <FieldError message={state.fieldErrors?.ingredientId} />

      <div className="mt-3">
        <QuantityInput
          name="quantity"
          value={qty}
          onChange={setQty}
          unitLabel={product ? DISPLAY_UNIT_LABEL[product.unit] : "—"}
          error={state.fieldErrors?.quantity}
        />
      </div>

      <Button type="submit" size="block" loading={isPending} className="mt-5 w-full font-bold">
        Добавить в запасы
      </Button>
    </form>
  );
}
