"use client";

import { useActionState, useEffect, useState } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addManualShoppingItem } from "@/lib/actions/shopping-list";
import { initialFormState } from "@/lib/form-state";
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from "@/lib/product-categories";
import type { ProductCategory, Unit } from "@/lib/types";
import { DISPLAY_UNIT_LABEL, sanitizeQuantityInput } from "@/lib/units";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const MANUAL_UNITS: Unit[] = ["PCS", "G", "ML"];

export function AddShoppingItemSheet({ open, onOpenChange }: Props) {
  // Ремоунт формы на каждое открытие — как в AddPantrySheet: состояние useActionState
  // переживает закрытие шита, и без сброса ошибки прошлой попытки мелькали бы в новой.
  const [formEpoch, setFormEpoch] = useState(0);
  useEffect(() => {
    if (open) setFormEpoch((n) => n + 1);
  }, [open]);

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
  const [state, formAction, isPending] = useActionState(addManualShoppingItem, initialFormState);
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState<Unit>("PCS");
  const [category, setCategory] = useState<ProductCategory>("OTHER");

  useEffect(() => {
    if (state.data) onSaved();
  }, [state, onSaved]);

  return (
    <form action={formAction}>
      <input type="hidden" name="unit" value={unit} />
      <input type="hidden" name="manualCategory" value={category} />

      {state.error && (
        <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="manual-name">Название</Label>
          <Input
            id="manual-name"
            name="name"
            defaultValue={state.values?.name}
            placeholder="Например, губки для посуды"
            error={state.fieldErrors?.name}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="manual-quantity">Количество</Label>
          <div className="flex gap-2.5">
            <Input
              id="manual-quantity"
              name="quantity"
              value={qty}
              onChange={(e) => setQty(sanitizeQuantityInput(e.target.value))}
              inputMode="decimal"
              placeholder="Кол-во"
              error={state.fieldErrors?.quantity}
              className="h-12 flex-1 rounded-lg text-center text-[15px] font-semibold"
            />
            <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
              <SelectTrigger className="h-12 w-[88px] rounded-lg" aria-label="Единица">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MANUAL_UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {DISPLAY_UNIT_LABEL[u]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Категория</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as ProductCategory)}>
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
