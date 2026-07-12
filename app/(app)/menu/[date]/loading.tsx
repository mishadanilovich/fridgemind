import { MealSlotSkeletonList } from "@/components/skeletons/MealSlotSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function MenuDayLoading() {
  return (
    <div className="pb-8">
      <Skeleton className="mb-3 h-4 w-36" />
      <div className="mb-4 flex items-start justify-between">
        <div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-1 h-9 w-44" />
        </div>
        <Skeleton className="size-11 rounded-full" />
      </div>

      <MealSlotSkeletonList count={3} />
    </div>
  );
}
