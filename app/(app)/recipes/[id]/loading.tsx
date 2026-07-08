import { Skeleton } from "@/components/ui/skeleton";

export default function RecipeDetailLoading() {
  return (
    <div className="-mx-5 -mt-4 pb-8">
      <Skeleton className="h-[230px] rounded-none" />
      <div className="space-y-4 px-[22px] pt-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-hero" />
      </div>
    </div>
  );
}
