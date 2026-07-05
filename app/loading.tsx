import { MealSlotSkeletonList } from "@/components/skeletons/MealSlotSkeleton";

// Next.js App Router показывает этот файл автоматически, пока серверный компонент
// app/page.tsx ("Сегодня") ждёт данные — см. CLAUDE.md, раздел 6 "Состояние загрузки".
export default function TodayLoading() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Сегодня</h1>
      <MealSlotSkeletonList count={3} />
    </div>
  );
}
