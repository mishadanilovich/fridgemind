import { MealSlotSkeletonList } from "@/components/skeletons/MealSlotSkeleton";
import { Skeleton } from "@/components/skeletons/Skeleton";

export default function MenuLoading() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Меню на неделю</h1>
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-10 shrink-0" />
        ))}
      </div>
      <MealSlotSkeletonList count={3} />
    </div>
  );
}
