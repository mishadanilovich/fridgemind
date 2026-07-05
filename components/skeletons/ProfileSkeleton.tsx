import { Skeleton } from "@/components/ui/skeleton";

/** Заглушка экрана "Профиль/Настройки" (см. CLAUDE.md, раздел 6). */
export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="h-3 w-32" /> {/* "Участники" заголовок */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <Skeleton className="h-3.5 flex-1" />
            <Skeleton className="h-5 w-16 shrink-0 rounded-full" /> {/* бейдж роли */}
          </div>
        ))}
      </div>
    </div>
  );
}
