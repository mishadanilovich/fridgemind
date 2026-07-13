"use client";

import { useState, useTransition } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { QuantityStepperRow } from "@/components/ui/quantity-stepper-row";
import { addBoughtToPantry } from "@/lib/actions/shopping-list";
import { useRemountKey } from "@/lib/hooks/use-remount-key";
import { neededQuantity } from "@/lib/shopping-list";
import type { ShoppingItemView } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Позиции с isBought и без addedToPantry, не ручные — кандидаты на перенос. */
  candidates: ShoppingItemView[];
};

/**
 * Шит "Перенести в запасы" (см. CLAUDE.md §6, поток "массовое обновление инвентаря"):
 * количества можно поправить перед переносом (купили больше/меньше), 0 — пропустить позицию,
 * она останется в этом шите на следующий раз.
 */
export function BulkPantrySheet({ open, onOpenChange, candidates }: Props) {
  const epoch = useRemountKey(open);

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      eyebrow="Купленное"
      title="Перенести в запасы"
      description="Поправьте количество перед переносом. Ноль — пропустить позицию: она останется здесь на следующий раз."
    >
      <BulkBody key={epoch} candidates={candidates} onDone={() => onOpenChange(false)} />
    </BottomSheet>
  );
}

function BulkBody({ candidates, onDone }: { candidates: ShoppingItemView[]; onDone: () => void }) {
  // Правки количеств — по id, а не по индексу: пока шит открыт, список кандидатов может
  // обновиться (realtime/ревалидация), и позиционное сопоставление разъехалось бы.
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // По умолчанию — сколько список и показывал к покупке (потребность недели минус запасы),
  // а не валовая недельная потребность: человек покупал по списку.
  const quantityOf = (item: ShoppingItemView) => overrides[item.id] ?? neededQuantity(item, null);
  const transferCount = candidates.filter((item) => quantityOf(item) > 0).length;

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await addBoughtToPantry({
        items: candidates.map((item) => ({ itemId: item.id, quantity: quantityOf(item) })),
      });
      if (result.error !== null) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  return (
    <>
      <FormErrorBanner message={error} />

      <div className="-mx-1 max-h-[45vh] overflow-y-auto px-1">
        <div className="rounded-card border border-border bg-card">
          {candidates.map((item) => (
            <QuantityStepperRow
              key={item.id}
              name={item.name}
              unit={item.unit}
              value={quantityOf(item)}
              onChange={(next) => setOverrides((prev) => ({ ...prev, [item.id]: next }))}
              dotClassName="bg-success-dot"
              strikeZero
            />
          ))}
        </div>
      </div>

      <Button
        type="button"
        size="block"
        loading={isPending}
        disabled={transferCount === 0}
        onClick={onConfirm}
        className="mt-5 w-full font-bold shadow-primary-glow"
      >
        Добавить {transferCount} в запасы
      </Button>
    </>
  );
}
