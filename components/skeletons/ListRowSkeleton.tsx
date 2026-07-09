import { Skeleton } from "@/components/ui/skeleton";

/**
 * Заглушка строки списка — переиспользуется для "Домашние запасы" и "Список покупок"
 * (см. CLAUDE.md, раздел 6): точка категории + название слева, количество справа.
 * `withCheckbox` добавляет кружок слева под чекбокс "куплено" (только для списка покупок).
 */
export function ListRowSkeleton({ withCheckbox = false }: { withCheckbox?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-secondary px-[15px] py-[13px] last:border-b-0">
      <div className="flex items-center gap-[11px]">
        {withCheckbox && <Skeleton className="size-6 shrink-0 rounded-lg" />}
        <Skeleton className="size-[9px] shrink-0 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-[15px] w-11" />
    </div>
  );
}

export function ListRowSkeletonGroup({
  rows = 4,
  withCheckbox = false,
}: {
  rows?: number;
  withCheckbox?: boolean;
}) {
  return (
    <div className="mb-[18px]">
      <Skeleton className="mx-1 mb-2 h-[15px] w-[110px]" /> {/* заголовок категории */}
      <div className="overflow-hidden rounded-card border border-border bg-card">
        {Array.from({ length: rows }).map((_, i) => (
          <ListRowSkeleton key={i} withCheckbox={withCheckbox} />
        ))}
      </div>
    </div>
  );
}
