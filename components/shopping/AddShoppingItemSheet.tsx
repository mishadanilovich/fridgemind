"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addManualShoppingItem } from "@/lib/actions/shopping-list";
import { guardFormAction, initialFormState } from "@/lib/form-state";
import { useRemountKey } from "@/lib/hooks/use-remount-key";
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from "@/lib/product-categories";
import type { Ingredient, ProductCategory, Unit } from "@/lib/types";
import { UNIT_TYPE_TO_UNIT } from "@/lib/units";

import { ManualItemFields } from "./ManualItemFields";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddShoppingItemSheet({ open, onOpenChange }: Props) {
  const formEpoch = useRemountKey(open);

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Своя позиция"
      description="Что угодно вне рецептов — например, бытовая химия. Попадёт в список этой недели."
    >
      <AddItemForm key={formEpoch} onSaved={() => onOpenChange(false)} />
    </BottomSheet>
  );
}

function AddItemForm({ onSaved }: { onSaved: () => void }) {
  const [state, formAction, isPending] = useActionState(guardFormAction(addManualShoppingItem), initialFormState);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState<Unit>("PCS");
  const [category, setCategory] = useState<ProductCategory>("OTHER");

  // Значения единицы/категории до автоподстановки из каталога — чтобы откатить их, когда имя
  // ушло с подставленного продукта (onNamePick(null)); чистится, если пользователь сам поменял
  // единицу/категорию — его выбор автоподстановка не воскрешает.
  const autoBaseline = useRef<{ unit: Unit; category: ProductCategory } | null>(null);

  function onNamePick(ingredient: Ingredient | null) {
    if (ingredient) {
      autoBaseline.current ??= { unit, category };
      setUnit(UNIT_TYPE_TO_UNIT[ingredient.defaultUnitType]);
      setCategory(ingredient.category);
    } else if (autoBaseline.current) {
      setUnit(autoBaseline.current.unit);
      setCategory(autoBaseline.current.category);
      autoBaseline.current = null;
    }
  }

  useEffect(() => {
    if (state.data) onSaved();
  }, [state, onSaved]);

  return (
    <form action={formAction}>
      <input type="hidden" name="manualCategory" value={category} />

      <FormErrorBanner message={state.error} />

      <div className="space-y-3">
        <ManualItemFields
          nameValue={name}
          onNameChange={setName}
          onNamePick={onNamePick}
          namePlaceholder="Например, губки для посуды"
          nameError={state.fieldErrors?.name}
          qty={qty}
          onQtyChange={setQty}
          qtyError={state.fieldErrors?.quantity}
          unit={unit}
          onUnitChange={(u) => {
            autoBaseline.current = null;
            setUnit(u);
          }}
        />

        <div className="space-y-1.5">
          <Label>Категория</Label>
          <Select
            value={category}
            onValueChange={(v) => {
              autoBaseline.current = null;
              setCategory(v as ProductCategory);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {PRODUCT_CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" size="block" loading={isPending} className="mt-5 w-full font-bold">
        Добавить в список
      </Button>
    </form>
  );
}
