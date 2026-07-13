import type { ReactNode } from "react";

import { PRODUCT_CATEGORY_LABELS } from "@/lib/product-categories";
import type { ProductCategory } from "@/lib/types";

type Props = {
  category: ProductCategory;
  count: number;
  children: ReactNode;
};

/** Заголовок категории + карточный контейнер строк — общая обёртка для инвентаря и списка покупок. */
export function CategorySection({ category, count, children }: Props) {
  return (
    <section className="mb-[18px]">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[13px] font-bold text-foreground">
          {PRODUCT_CATEGORY_LABELS[category]}
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground">{count}</span>
      </div>
      <div className="overflow-hidden rounded-card border border-border bg-card">{children}</div>
    </section>
  );
}
