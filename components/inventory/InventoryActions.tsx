"use client";

import { Camera, Plus } from "lucide-react";
import { useState } from "react";

import { AddPantrySheet } from "./AddPantrySheet";

// Кнопка "Сфотографировать запасы" — заглушка до подключения Claude Vision (этап 5,
// вторая часть): распознавание фото делается следом за ручным вводом.
export function InventoryActions() {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <div className="mb-5 flex gap-2.5">
        <button
          type="button"
          disabled
          className="flex flex-1 flex-col items-center gap-[7px] rounded-card bg-primary px-3 py-[15px] text-[13.5px] font-bold text-primary-foreground opacity-50 shadow-card"
        >
          <Camera className="size-[22px]" />
          Сфотографировать запасы
          <span className="-mt-1 text-[10.5px] font-semibold opacity-80">скоро</span>
        </button>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="pressable flex w-[88px] flex-col items-center justify-center gap-[7px] rounded-card border border-border bg-card px-3 py-3 text-[12.5px] font-bold text-primary"
        >
          <Plus className="size-[22px]" strokeWidth={2.2} />
          Вручную
        </button>
      </div>

      <AddPantrySheet open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
