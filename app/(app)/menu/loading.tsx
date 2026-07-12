import { WeekDaySkeletonList } from "@/components/skeletons/MealSlotSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function MenuLoading() {
  return (
    <div className="pb-8">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <Skeleton className="h-4 w-24" />
          <h1 className="mt-1 font-heading text-[34px] font-bold leading-[1.05] text-foreground">
            Меню на неделю
          </h1>
        </div>
        <Skeleton className="size-11 rounded-full" />
      </div>

      <WeekDaySkeletonList count={4} />
    </div>
  );
}
