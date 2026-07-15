"use client";

import { WifiOff } from "lucide-react";

import { useOnline } from "@/lib/hooks/use-online";

// Индикатор офлайна поверх любого экрана: пользователь понимает, что видит сохранённые
// данные, а не живые, и что изменения сейчас не сохранятся.
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-1.5 bg-foreground/90 py-1.5 text-[11.5px] font-bold text-background backdrop-blur-sm">
      <WifiOff className="size-3.5" strokeWidth={2.4} />
      Нет сети — показаны сохранённые данные
    </div>
  );
}
