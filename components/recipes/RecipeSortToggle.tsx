"use client";

import { Bookmark, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { cn } from "@/lib/utils";

type Props = {
  active: boolean;
};

export function RecipeSortToggle({ active }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState(active);

  useEffect(() => {
    setOptimistic(active);
  }, [active]);

  function toggle() {
    const next = !optimistic;
    setOptimistic(next);
    startTransition(() => {
      router.push(next ? "/recipes?have=1" : "/recipes", { scroll: false });
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={optimistic}
      className={cn(
        "mb-[18px] flex w-full items-center justify-between gap-3 rounded-[18px] border px-4 py-[13px] text-left transition-colors",
        optimistic ? "border-primary bg-primary" : "border-border bg-card",
        isPending && "opacity-90",
      )}
    >
      <span className="flex items-center gap-[11px]">
        <span
          className={cn(
            "flex size-[34px] items-center justify-center rounded-[11px]",
            optimistic ? "bg-black/15 text-primary-foreground" : "bg-success text-primary",
          )}
        >
          <Bookmark className="size-[19px]" />
        </span>
        <span>
          <span
            className={cn(
              "block text-sm font-bold",
              optimistic ? "text-primary-foreground" : "text-foreground",
            )}
          >
            Приготовить из того, что есть
          </span>
          <span
            className={cn(
              "block text-[11.5px] font-medium",
              optimistic ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            Сортировка по наличию продуктов
          </span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2.5">
        {isPending && (
          <Loader2
            className={cn(
              "size-4 animate-spin",
              optimistic ? "text-primary-foreground/80" : "text-muted-foreground",
            )}
          />
        )}
        <span
          className={cn(
            "relative h-[27px] w-[46px] rounded-full transition-colors",
            optimistic ? "bg-accent" : "bg-secondary",
          )}
        >
          <span
            className={cn(
              "absolute top-[3px] size-[21px] rounded-full bg-white shadow transition-all",
              optimistic ? "left-[22px]" : "left-[3px]",
            )}
          />
        </span>
      </span>
    </button>
  );
}
