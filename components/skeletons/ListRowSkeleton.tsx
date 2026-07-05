import { Skeleton } from "./Skeleton";

/**
 * Заглушка строки списка — переиспользуется для "Домашние запасы" и "Список покупок"
 * (см. CLAUDE.md, раздел 6). `withCheckbox` добавляет кружок слева под чекбокс "куплено"
 * (только для списка покупок — в инвентаре его нет).
 */
export function ListRowSkeleton({ withCheckbox = false }: { withCheckbox?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2">
      {withCheckbox && <Skeleton className="h-5 w-5 shrink-0 rounded-full" />}
      <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
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
    <div className="space-y-1 rounded-lg border border-border p-3">
      <Skeleton className="mb-2 h-3 w-24" /> {/* заголовок категории */}
      {Array.from({ length: rows }).map((_, i) => (
        <ListRowSkeleton key={i} withCheckbox={withCheckbox} />
      ))}
    </div>
  );
}
