import { ListRowSkeletonGroup } from "@/components/skeletons/ListRowSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function InventoryLoading() {
  return (
    <div className="pb-8">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-accent">
            Дома есть
          </div>
          <h1 className="mt-1 font-heading text-[34px] font-bold leading-[1.05] text-foreground">
            Запасы
          </h1>
        </div>
        <Skeleton className="size-11 rounded-full" />
      </div>

      <div className="mb-5 flex gap-2.5">
        <Skeleton className="h-[104px] flex-1 rounded-card" />
        <Skeleton className="h-[104px] w-[88px] rounded-card" />
      </div>

      <ListRowSkeletonGroup rows={3} />
      <ListRowSkeletonGroup rows={2} />
    </div>
  );
}
