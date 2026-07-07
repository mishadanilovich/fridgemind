import { Skeleton } from "@/components/ui/skeleton";

export function RecipeCardSkeleton() {
  return (
    <div className="mb-3 flex gap-3 rounded-[20px] border border-border bg-card p-[11px]">
      <Skeleton className="size-[82px] shrink-0 rounded-[15px]" />
      <div className="flex flex-1 flex-col justify-center gap-2">
        <Skeleton className="h-[18px] w-[70%]" />
        <Skeleton className="h-5 w-[100px] rounded-full" />
      </div>
    </div>
  );
}

export function RecipeCardSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  );
}
