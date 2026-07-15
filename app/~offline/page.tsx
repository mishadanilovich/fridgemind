import type { Metadata } from "next";

import { OfflineApp } from "@/components/offline/OfflineApp";

export const metadata: Metadata = {
  title: "FridgeMind — офлайн",
};

// Офлайн-фоллбэк: precache'ится service worker'ом (additionalPrecacheEntries в next.config.mjs)
// и отдаётся вместо любой страницы, когда сети нет, а её HTML нет в runtime-кэше. Экран
// рендерится целиком на клиенте из офлайн-кэша Dexie — без обращения к серверу и без auth.
export default function OfflinePage() {
  return <OfflineApp />;
}
