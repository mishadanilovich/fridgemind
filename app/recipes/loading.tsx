import { RecipeCardSkeletonGrid } from "@/components/skeletons/RecipeCardSkeleton";

export default function RecipesLoading() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Рецепты</h1>
      <RecipeCardSkeletonGrid count={4} />
    </div>
  );
}
