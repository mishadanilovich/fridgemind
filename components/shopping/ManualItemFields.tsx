"use client";

import { IngredientSuggestInput } from "@/components/ingredients/IngredientSuggestInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Ingredient, Unit } from "@/lib/types";
import { DISPLAY_UNIT_LABEL, sanitizeQuantityInput } from "@/lib/units";

export const MANUAL_UNITS: Unit[] = ["PCS", "G", "ML"];

type Props = {
  namePlaceholder?: string;
  nameError?: string;
  nameValue: string;
  onNameChange: (value: string) => void;
  onNamePick?: (ingredient: Ingredient) => void;
  qty: string;
  onQtyChange: (value: string) => void;
  qtyError?: string;
  unit: Unit;
  onUnitChange: (unit: Unit) => void;
};

/**
 * Поля ручной позиции списка покупок (название + количество + единица) — общие для
 * добавления (AddShoppingItemSheet) и редактирования (EditShoppingItemSheet). Значения
 * уходят в FormData под именами name/quantity/unit.
 */
export function ManualItemFields({
  namePlaceholder,
  nameError,
  nameValue,
  onNameChange,
  onNamePick,
  qty,
  onQtyChange,
  qtyError,
  unit,
  onUnitChange,
}: Props) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="manual-name">Название</Label>
        <IngredientSuggestInput
          id="manual-name"
          name="name"
          value={nameValue}
          onChange={onNameChange}
          onPick={onNamePick}
          placeholder={namePlaceholder}
          error={nameError}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="manual-quantity">Количество</Label>
        <div className="flex gap-2.5">
          <input type="hidden" name="unit" value={unit} />
          <Input
            id="manual-quantity"
            name="quantity"
            value={qty}
            onChange={(e) => onQtyChange(sanitizeQuantityInput(e.target.value))}
            inputMode="decimal"
            placeholder="Кол-во"
            error={qtyError}
            className="h-12 flex-1 rounded-lg text-center text-base font-semibold"
          />
          <Select value={unit} onValueChange={(v) => onUnitChange(v as Unit)}>
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
    </>
  );
}
