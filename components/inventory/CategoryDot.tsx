import type { ProductCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const DOT_CLASS: Record<ProductCategory, string> = {
  DAIRY: "bg-dot-dairy",
  MEAT_FISH: "bg-dot-meat",
  VEGETABLES_FRUITS: "bg-dot-produce",
  GROCERY: "bg-dot-grocery",
  BAKERY: "bg-dot-grocery",
  BEVERAGES: "bg-dot-neutral",
  FROZEN: "bg-dot-neutral",
  HOUSEHOLD_CHEMICALS: "bg-dot-neutral",
  PERSONAL_CARE: "bg-dot-neutral",
  OTHER: "bg-dot-neutral",
};

type Props = {
  category: ProductCategory;
  className?: string;
};

export function CategoryDot({ category, className }: Props) {
  return (
    <span className={cn("size-[9px] shrink-0 rounded-full", DOT_CLASS[category], className)} />
  );
}
