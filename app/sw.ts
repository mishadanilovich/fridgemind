/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// Офлайн-слой (см. CLAUDE.md, раздел 6 "Офлайн" и раздел 4 "PWA-слой"):
// stale-while-revalidate для статики и API — Dexie (клиентский IndexedDB-кэш) хранит
// последнее актуальное меню/список покупок для чтения без сети отдельно от этого файла.

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
