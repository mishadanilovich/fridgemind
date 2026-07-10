"use client";

import { Camera, Plus } from "lucide-react";
import { useState } from "react";

import { AddPantrySheet } from "./AddPantrySheet";
import { ScanSheet } from "./ScanSheet";

export function InventoryActions() {
  const [scanOpen, setScanOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <div className="mb-5 flex gap-2.5">
        <button
          type="button"
          onClick={() => setScanOpen(true)}
          className="pressable flex flex-1 flex-col items-center gap-[7px] rounded-card bg-primary px-3 py-[15px] text-[13.5px] font-bold text-primary-foreground shadow-card"
        >
          <Camera className="size-[22px]" />
          Сфотографировать запасы
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

      <ScanSheet open={scanOpen} onOpenChange={setScanOpen} />
      <AddPantrySheet open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
