import { ScreenHeader } from "@/components/nav/ScreenHeader";
import { ShoppingListBoard } from "@/components/shopping/ShoppingListBoard";
import { getCurrentUser } from "@/lib/auth";
import { formatWeekRange, startOfWeekIso, todayIso } from "@/lib/dates";
import { getShoppingListView } from "@/lib/queries/shopping-list";

export default async function ShoppingListPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const today = todayIso();
  const weekStart = startOfWeekIso(today);
  const items = await getShoppingListView(user.householdId, weekStart);

  return (
    <div className="pb-8">
      <ScreenHeader
        eyebrow={`На неделю · ${formatWeekRange(weekStart)}`}
        title="Список покупок"
      />
      <ShoppingListBoard items={items} today={today} weekStart={weekStart} />
    </div>
  );
}
