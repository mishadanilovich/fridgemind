import { RecipeCardSkeletonList } from "@/components/skeletons/RecipeCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecipesLoading() {
  return (
    <div className="pb-8">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-accent">
            Библиотека
          </div>
          <h1 className="mt-1 font-heading text-[34px] font-bold leading-[1.05] text-foreground">
            Рецепты
          </h1>
        </div>
        <Skeleton className="size-11 rounded-full" />
      </div>

      <Skeleton className="mb-[18px] h-[62px] w-full rounded-toggle" />
      <Skeleton className="mb-3 h-[92px] w-full rounded-card" />

      <RecipeCardSkeletonList count={4} />
    </div>
  );
}
