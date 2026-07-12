import { Skeleton } from "@/components/ui/skeleton";

/**
 * Заглушка карточки приёма пищи — экраны "Сегодня" и просмотр дня
 * (см. CLAUDE.md, раздел 6, описание карточки слота).
 */
export function MealSlotSkeleton() {
  return (
    <div className="mb-4 overflow-hidden rounded-hero border border-border bg-card">
      <Skeleton className="h-[150px] rounded-none" />
      <div className="px-[15px] py-[13px]">
        <Skeleton className="mb-2.5 h-5 w-3/5" />
        <div className="flex gap-2">
          <Skeleton className="h-[22px] w-[70px] rounded-full" />
          <Skeleton className="h-[22px] w-[90px] rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function MealSlotSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <MealSlotSkeleton key={i} />
      ))}
    </div>
  );
}

/** Заглушка дня на экране "Меню на неделю" — шапка дня + ряд из трёх слотов. */
export function WeekDaySkeleton() {
  return (
    <div className="mb-3 rounded-card border border-border bg-card px-[15px] py-3.5">
      <div className="mb-2.5 flex items-center gap-2.5">
        <Skeleton className="size-9 rounded-md" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] flex-1 rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function WeekDaySkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <WeekDaySkeleton key={i} />
      ))}
    </div>
  );
}
