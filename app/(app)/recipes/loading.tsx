import { RecipeCardSkeletonList } from "@/components/skeletons/RecipeCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

// Совпадает по разметке с экраном "Рецепты": та же шапка и горизонтальные карточки-строки,
// чтобы при загрузке не было "прыжка" layout (см. CLAUDE.md, раздел 6).
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
      <RecipeCardSkeletonList count={5} />
    </div>
  );
}
