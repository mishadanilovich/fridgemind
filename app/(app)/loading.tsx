import { MealSlotSkeletonList } from "@/components/skeletons/MealSlotSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

// Next.js App Router показывает этот файл автоматически, пока серверный компонент
// app/page.tsx ("Сегодня") ждёт данные — см. CLAUDE.md, раздел 6 "Состояние загрузки".
export default function TodayLoading() {
  return (
    <div className="pb-8">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <Skeleton className="h-4 w-28" />
          <h1 className="mt-1 font-heading text-[34px] font-bold leading-[1.05] text-foreground">
            Сегодня
          </h1>
        </div>
        <Skeleton className="size-11 rounded-full" />
      </div>

      <MealSlotSkeletonList count={3} />
    </div>
  );
}
