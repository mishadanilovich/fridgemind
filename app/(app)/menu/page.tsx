import { WeekBoard } from "@/components/menu/WeekBoard";
import { WeekMenuSheet } from "@/components/menu/WeekMenuSheet";
import { ScreenHeader } from "@/components/nav/ScreenHeader";
import { OfflineSnapshot } from "@/components/offline/OfflineSnapshot";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { formatWeekRange, startOfWeekIso, todayIso } from "@/lib/dates";
import { getMenuTemplates, getPickerRecipes, getWeekBoard } from "@/lib/queries/menu";

export default async function MenuPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const canEdit = hasRole(user, ["ORGANIZER", "EDITOR"]);
  const weekStart = startOfWeekIso(todayIso());
  const [days, recipes, templates] = await Promise.all([
    getWeekBoard(user.householdId, weekStart, canEdit),
    canEdit ? getPickerRecipes(user.householdId) : [],
    canEdit ? getMenuTemplates(user.householdId) : [],
  ]);

  // Шаблоны — только Организатору/Редактору (см. CLAUDE.md §5). weekHasPlan управляет
  // предупреждением при применении: заменять нечего, если неделя пуста.
  const weekHasPlan = days.some((day) => day.slots.some((slot) => slot.meal !== null));

  return (
    <div className="pb-8">
      <ScreenHeader
        eyebrow={formatWeekRange(weekStart)}
        title="Меню на неделю"
        aside={
          canEdit ? (
            <WeekMenuSheet weekStart={weekStart} templates={templates} weekHasPlan={weekHasPlan} />
          ) : undefined
        }
      />
      <WeekBoard days={days} recipes={recipes} canEdit={canEdit} />
      <OfflineSnapshot
        householdId={user.householdId}
        snapshot={{ table: "menuWeeks", id: weekStart, data: days }}
      />
    </div>
  );
}
