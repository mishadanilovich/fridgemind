import { Skeleton } from "@/components/ui/skeleton";

/** Заглушка карточки рецепта — экран "Рецепты" (см. CLAUDE.md, раздел 6). */
export function RecipeCardSkeleton() {
  return (
    <div className="space-y-2 rounded-lg border border-border p-2">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex gap-1.5">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
    </div>
  );
}

export function RecipeCardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  );
}
