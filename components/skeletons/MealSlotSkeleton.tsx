import { Skeleton } from "./Skeleton";

/**
 * Заглушка карточки приёма пищи — экраны "Сегодня" и "Меню на неделю"
 * (см. CLAUDE.md, раздел 6, описание карточки слота).
 */
export function MealSlotSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
      <Skeleton className="h-16 w-16 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function MealSlotSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <MealSlotSkeleton key={i} />
      ))}
    </div>
  );
}
