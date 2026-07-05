import { ListRowSkeletonGroup } from "@/components/skeletons/ListRowSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShoppingListLoading() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Список покупок</h1>
      <div className="flex gap-2">
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <ListRowSkeletonGroup rows={3} withCheckbox />
      <ListRowSkeletonGroup rows={2} withCheckbox />
    </div>
  );
}
