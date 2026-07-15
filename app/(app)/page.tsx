import { DayBoard } from "@/components/menu/DayBoard";
import { ScreenHeader } from "@/components/nav/ScreenHeader";
import { OfflineSnapshot } from "@/components/offline/OfflineSnapshot";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { todayIso, weekdayName } from "@/lib/dates";
import { countMeals } from "@/lib/menu";
import { getDayBoard, getPickerRecipes } from "@/lib/queries/menu";

export default async function TodayPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const canEdit = hasRole(user, ["ORGANIZER", "EDITOR"]);
  const today = todayIso();
  const [day, recipes] = await Promise.all([
    getDayBoard(user.householdId, today, canEdit),
    canEdit ? getPickerRecipes(user.householdId) : [],
  ]);
  const { planned, eaten } = countMeals(day.slots);

  return (
    <div className="pb-8">
      <ScreenHeader
        eyebrow={weekdayName(today)}
        title="Сегодня"
        aside={
          planned > 0 ? (
            <div className="flex flex-col items-center gap-0.5 rounded-lg border border-border bg-card px-3 py-2">
              <span className="font-heading text-xl font-extrabold text-primary">
                {eaten}/{planned}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground">приёмов</span>
            </div>
          ) : null
        }
      />

      <DayBoard day={day} recipes={recipes} canEdit={canEdit} />
      <OfflineSnapshot
        householdId={user.householdId}
        snapshot={{ table: "menuDays", id: today, data: day }}
      />
    </div>
  );
}
