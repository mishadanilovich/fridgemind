import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DayBoard } from "@/components/menu/DayBoard";
import { DayIngredients } from "@/components/menu/DayIngredients";
import { ScreenHeader } from "@/components/nav/ScreenHeader";
import { OfflineSnapshot } from "@/components/offline/OfflineSnapshot";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { formatDayTitle, isIsoDate, todayIso, weekdayName } from "@/lib/dates";
import { getDayBoard, getPickerRecipes } from "@/lib/queries/menu";
import { getDayIngredients } from "@/lib/queries/shopping-list";

type Props = PageProps<"/menu/[date]">;

export default async function MenuDayPage({ params }: Props) {
  const { date } = await params;
  if (!isIsoDate(date)) notFound();

  const user = await getCurrentUser();
  if (!user) return null;

  const canEdit = hasRole(user, ["ORGANIZER", "EDITOR"]);
  const [day, recipes, ingredients] = await Promise.all([
    getDayBoard(user.householdId, date, canEdit),
    canEdit ? getPickerRecipes(user.householdId) : [],
    getDayIngredients(user.householdId, date),
  ]);

  return (
    <div className="pb-8">
      <Link
        href="/menu"
        className="mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-muted-foreground"
      >
        <ChevronLeft className="size-4" />
        Меню на неделю
      </Link>

      <ScreenHeader
        eyebrow={date === todayIso() ? "Сегодня" : formatDayTitle(date)}
        title={weekdayName(date)}
      />

      <DayBoard day={day} recipes={recipes} canEdit={canEdit} />

      <DayIngredients ingredients={ingredients} />
      <OfflineSnapshot snapshot={{ table: "menuDays", id: date, data: day }} />
    </div>
  );
}
