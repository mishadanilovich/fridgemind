"use client";

import { useEffect } from "react";

import { type OfflineSnapshotInput, saveOfflineSnapshot } from "@/lib/offline-db";

type Props = {
  snapshot: OfflineSnapshotInput;
};

// Кладёт данные, уже полученные серверным компонентом экрана, в офлайн-кэш Dexie — без
// дублирующего запроса к API; при обновлении RSC-данных (revalidatePath, Realtime) снапшот
// перезаписывается свежим.
export function OfflineSnapshot({ snapshot }: Props) {
  useEffect(() => {
    saveOfflineSnapshot(snapshot).catch(() => {
      // IndexedDB может быть недоступен (приватный режим) — тогда офлайн-кэша просто нет.
    });
  }, [snapshot]);

  return null;
}
