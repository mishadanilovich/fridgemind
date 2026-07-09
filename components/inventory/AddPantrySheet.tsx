"use client";

import { useActionState, useEffect, useState } from "react";

import { IngredientPicker } from "@/components/ingredients/IngredientPicker";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
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
  const [state, formAction, isPending] = useActionState(addPantryItem, initialFormState);
  const [product, setProduct] = useState<PickedProduct | null>(null);
  const [qty, setQty] = useState("");

  useEffect(() => {
    if (state.data) {
      setProduct(null);
      setQty("");
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  function onSelect(ingredient: Ingredient) {
    setProduct({
      id: ingredient.id,
      name: ingredient.name,
      unit: UNIT_TYPE_TO_UNIT[ingredient.defaultUnitType],
    });
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Добавить продукт"
      description="Если продукт уже есть в запасах, количество сложится."
    >
      <form action={formAction}>
        <input type="hidden" name="ingredientId" value={product?.id ?? ""} />
        <input type="hidden" name="unit" value={product?.unit ?? ""} />

        {state.error && (
          <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {state.error}
          </div>
        )}

        <IngredientPicker value={product} onSelect={onSelect} />
        <FieldError message={state.fieldErrors?.ingredientId} />

        <div className="mt-3 flex items-center gap-2.5">
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
            {product ? DISPLAY_UNIT_LABEL[product.unit] : "—"}
          </span>
        </div>

        <Button type="submit" size="block" loading={isPending} className="mt-5 w-full font-bold">
          Добавить в запасы
        </Button>
      </form>
    </BottomSheet>
  );
}
