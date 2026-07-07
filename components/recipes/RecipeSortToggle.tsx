"use client";

import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

type Props = {
  active: boolean;
};

export function RecipeSortToggle({ active }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(active ? "/recipes" : "/recipes?have=1", { scroll: false })}
      className={cn(
        "mb-[18px] flex w-full items-center justify-between gap-3 rounded-[18px] border px-4 py-[13px] text-left transition-colors",
        active ? "border-primary bg-primary" : "border-border bg-card",
      )}
    >
      <span className="flex items-center gap-[11px]">
        <span
          className={cn(
            "flex size-[34px] items-center justify-center rounded-[11px]",
            active ? "bg-black/15 text-primary-foreground" : "bg-success text-primary",
          )}
        >
          <Bookmark className="size-[19px]" />
        </span>
        <span>
          <span
            className={cn(
              "block text-sm font-bold",
              active ? "text-primary-foreground" : "text-foreground",
            )}
          >
            Приготовить из того, что есть
          </span>
          <span
            className={cn(
              "block text-[11.5px] font-medium",
              active ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            Сортировка по наличию продуктов
          </span>
        </span>
      </span>
      <span
        className={cn(
          "relative h-[27px] w-[46px] shrink-0 rounded-full transition-colors",
          active ? "bg-accent" : "bg-secondary",
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] size-[21px] rounded-full bg-white shadow transition-all",
            active ? "left-[22px]" : "left-[3px]",
          )}
        />
      </span>
    </button>
  );
}
