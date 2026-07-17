"use client";

import { Pencil, SearchX } from "lucide-react";
import { useState } from "react";

import { CategorySection } from "@/components/ui/category-section";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import type { PantryGroup } from "@/lib/pantry";
import { matchesQuery } from "@/lib/search";
import type { PantryItemView } from "@/lib/types";
import { formatQuantity } from "@/lib/units";

import { CategoryDot } from "./CategoryDot";
import { EditPantrySheet } from "./EditPantrySheet";

type Props = {
  groups: PantryGroup[];
};

export function PantryGroups({ groups }: Props) {
  const [editing, setEditing] = useState<PantryItemView | null>(null);
  const [query, setQuery] = useState("");

  const filteredGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => matchesQuery([item.ingredient.name], query)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <div className="mb-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Поиск продуктов" />
      </div>

      {filteredGroups.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Ничего не найдено"
          description="Проверьте запрос — поиск идёт по названию продукта."
        />
      ) : (
        filteredGroups.map((group) => (
          <CategorySection
            key={group.category}
            category={group.category}
            count={group.items.length}
          >
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
          </CategorySection>
        ))
      )}

      {editing && (
        <EditPantrySheet key={editing.id} item={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
