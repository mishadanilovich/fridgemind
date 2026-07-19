"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";

import { CategorySection } from "@/components/ui/category-section";
import { SearchInput, SearchNoResults } from "@/components/ui/search-input";
import { useLocalSearch } from "@/lib/hooks/use-local-search";
import type { PantryGroup } from "@/lib/pantry";
import { matchesQuery } from "@/lib/search";
import type { PantryItemView } from "@/lib/types";
import { formatQuantity } from "@/lib/units";

import { CategoryDot } from "./CategoryDot";
import { EditPantrySheet } from "./EditPantrySheet";

type Props = {
  groups: PantryGroup[];
};

function filterGroups(groups: PantryGroup[], query: string) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => matchesQuery([item.ingredient.name], query)),
    }))
    .filter((group) => group.items.length > 0);
}

export function PantryGroups({ groups }: Props) {
  const [editing, setEditing] = useState<PantryItemView | null>(null);
  const { query, setQuery, results, noResults } = useLocalSearch(groups, filterGroups);

  return (
    <>
      <SearchInput
        className="mb-3"
        value={query}
        onChange={setQuery}
        placeholder="Поиск продуктов"
      />

      {noResults ? (
        <SearchNoResults description="Проверьте запрос — поиск идёт по названию продукта." />
      ) : (
        results.map((group) => (
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
