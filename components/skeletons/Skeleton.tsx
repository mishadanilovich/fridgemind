import { cn } from "@/lib/utils";

/**
 * Базовый skeleton-блок — серый прямоугольник со скруглением и пульсацией.
 * См. CLAUDE.md, раздел 6 "Состояние загрузки при переходе между экранами".
 * Собирается в конкретные формы (карточка рецепта, строка инвентаря и т.д.)
 * в остальных файлах этой папки — не дублировать разметку по месту использования.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}
