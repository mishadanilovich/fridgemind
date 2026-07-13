import { ListRowSkeletonGroup } from "@/components/skeletons/ListRowSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShoppingListLoading() {
  return (
    <div className="pb-8">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <Skeleton className="h-4 w-36" />
          <h1 className="mt-1 font-heading text-[34px] font-bold leading-[1.05] text-foreground">
            Список покупок
          </h1>
        </div>
        <Skeleton className="size-11 rounded-full" />
      </div>

      <div className="mb-4 flex gap-2">
        <Skeleton className="h-[38px] w-24 rounded-full" />
        <Skeleton className="h-[38px] w-20 rounded-full" />
        <Skeleton className="h-[38px] w-28 rounded-full" />
      </div>
      <Skeleton className="mb-[18px] h-[50px] w-full rounded-card" />

      <ListRowSkeletonGroup rows={3} />
      <ListRowSkeletonGroup rows={2} />
    </div>
  );
}
