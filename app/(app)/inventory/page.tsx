import { Refrigerator } from "lucide-react";

import { InventoryActions } from "@/components/inventory/InventoryActions";
import { PantryGroups } from "@/components/inventory/PantryGroups";
import { ScreenHeader } from "@/components/nav/ScreenHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { getPantryGroups } from "@/lib/queries/pantry";

export default async function InventoryPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const groups = await getPantryGroups(user.householdId);

  return (
    <div className="pb-8">
      <ScreenHeader eyebrow="Дома есть" title="Запасы" />
      <InventoryActions />

      {groups.length === 0 ? (
        <EmptyState
          icon={Refrigerator}
          title="Пока пусто"
          description="Добавьте продукты вручную — а скоро можно будет просто сфотографировать холодильник."
        />
      ) : (
        <PantryGroups groups={groups} />
      )}
    </div>
  );
}
