import { Skeleton } from "@/components/ui/skeleton";

function Label({ children }: { children: string }) {
  return (
    <div className="mb-2 text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground">
      {children}
    </div>
  );
}

export default function EditRecipeLoading() {
  return (
    <div className="-mx-5 -mt-4">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-5 py-4 backdrop-blur">
        <span className="text-sm font-semibold text-muted-foreground">Отмена</span>
        <div className="font-heading text-base font-bold text-foreground">Изменить рецепт</div>
        <span className="text-sm font-extrabold text-accent/40">Сохранить</span>
      </div>

      <div className="space-y-6 px-5 pb-11 pt-5">
        <div>
          <Label>Фото рецепта</Label>
          <Skeleton className="h-[168px] rounded-[20px]" />
        </div>
        <div>
          <Label>Название</Label>
          <Skeleton className="h-12 rounded-lg" />
        </div>
        <div>
          <Label>Базовое количество порций</Label>
          <Skeleton className="h-[62px] rounded-2xl" />
        </div>
        <div>
          <Label>Способ приготовления</Label>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-full" />
            ))}
          </div>
        </div>
        <div>
          <Label>Ингредиенты</Label>
          <div className="space-y-2.5">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-md" />
            ))}
          </div>
        </div>
        <div>
          <Label>Шаги приготовления</Label>
          <Skeleton className="h-40 rounded-[16px]" />
        </div>
      </div>
    </div>
  );
}
