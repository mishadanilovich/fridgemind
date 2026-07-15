"use client";

import { useEffect } from "react";

import { type OfflineSnapshotInput, saveOfflineSnapshot } from "@/lib/offline-db";

type Props = {
  householdId: string;
  snapshot: OfflineSnapshotInput;
};

// Эффект зависит от самого объекта snapshot: при каждом обновлении RSC-данных
// (revalidatePath, Realtime) сервер присылает новый объект — кэш переписывается свежим.
export function OfflineSnapshot({ householdId, snapshot }: Props) {
  useEffect(() => {
    saveOfflineSnapshot(householdId, snapshot).catch(() => {
      // IndexedDB может быть недоступен (приватный режим) — тогда офлайн-кэша просто нет.
    });
  }, [householdId, snapshot]);

  return null;
}
