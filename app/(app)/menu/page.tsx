import { WeekBoard } from "@/components/menu/WeekBoard";
import { ScreenHeader } from "@/components/nav/ScreenHeader";
import { OfflineSnapshot } from "@/components/offline/OfflineSnapshot";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { formatWeekRange, startOfWeekIso, todayIso } from "@/lib/dates";
import { getPickerRecipes, getWeekBoard } from "@/lib/queries/menu";

export default async function MenuPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const canEdit = hasRole(user, ["ORGANIZER", "EDITOR"]);
  const weekStart = startOfWeekIso(todayIso());
  const [days, recipes] = await Promise.all([
    getWeekBoard(user.householdId, weekStart, canEdit),
    canEdit ? getPickerRecipes(user.householdId) : [],
  ]);

  return (
    <div className="pb-8">
      <ScreenHeader eyebrow={formatWeekRange(weekStart)} title="Меню на неделю" />
      <WeekBoard days={days} recipes={recipes} canEdit={canEdit} />
      <OfflineSnapshot snapshot={{ table: "menuWeeks", id: weekStart, data: days }} />
    </div>
  );
}
