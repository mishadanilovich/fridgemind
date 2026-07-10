"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";

import type { PantryGroup } from "@/lib/pantry";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/product-categories";
import type { PantryItemView } from "@/lib/types";
import { formatQuantity } from "@/lib/units";

import { CategoryDot } from "./CategoryDot";
import { EditPantrySheet } from "./EditPantrySheet";

type Props = {
  groups: PantryGroup[];
};

export function PantryGroups({ groups }: Props) {
  const [editing, setEditing] = useState<PantryItemView | null>(null);

  return (
    <>
      {groups.map((group) => (
        <section key={group.category} className="mb-[18px]">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[13px] font-bold text-foreground">
              {PRODUCT_CATEGORY_LABELS[group.category]}
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {group.items.length}
            </span>
          </div>
          <div className="overflow-hidden rounded-card border border-border bg-card">
            {group.items.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setEditing(item)}
                className="flex w-full items-center justify-between border-b border-secondary px-[15px] py-[13px] text-left last:border-b-0"
              >
                <span className="flex min-w-0 items-center gap-[11px]">
                  <CategoryDot category={group.category} />
                  <span className="truncate text-[14.5px] font-semibold text-foreground">
                    {item.ingredient.name}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-[9px]">
                  <span className="font-heading text-[13.5px] font-bold text-muted-foreground">
                    {formatQuantity(item.quantity, item.unit)}
                  </span>
                  <Pencil className="size-4 text-nav-inactive" />
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}

      {editing && (
        <EditPantrySheet key={editing.id} item={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
