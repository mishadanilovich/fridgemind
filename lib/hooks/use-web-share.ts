"use client";

import { useEffect, useState } from "react";

export type ShareResult = "shared" | "copied" | "dismissed" | "failed";

// Web Share API с фолбэком на буфер обмена (для десктопа без navigator.share). canShare нужен
// только тем, кто решает показывать ли кнопку "поделиться" в разметке (SSR-безопасно через
// useEffect); тем, кто зовёт share только по клику, canShare не нужен — проверка внутри share().
export function useWebShare() {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && Boolean(navigator.share));
  }, []);

  async function share(data: ShareData): Promise<ShareResult> {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(data);
        return "shared";
      } catch (err) {
        // Отмена пользователем — это не ошибка; остальное (нет прав, неподдерживаемые данные) — да.
        if (err instanceof DOMException && err.name === "AbortError") return "dismissed";
        return "failed";
      }
    }
    const text = data.url ?? data.text ?? "";
    try {
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch {
      return "failed";
    }
  }

  return { canShare, share };
}
