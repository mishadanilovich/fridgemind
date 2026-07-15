import { ScreenHeader } from "@/components/nav/ScreenHeader";
import { OfflineSnapshot } from "@/components/offline/OfflineSnapshot";
import { ShoppingListBoard } from "@/components/shopping/ShoppingListBoard";
import { ShoppingListRealtime } from "@/components/shopping/ShoppingListRealtime";
import { getCurrentUser } from "@/lib/auth";
import { formatWeekRange, startOfWeekIso, todayIso } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { getShoppingListView } from "@/lib/queries/shopping-list";
import { cn } from "@/lib/utils";

const AVATAR_CLASSES = ["bg-primary", "bg-accent", "bg-success-dot"];

export default async function ShoppingListPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const today = todayIso();
  const weekStart = startOfWeekIso(today);
  const [items, members] = await Promise.all([
    getShoppingListView(user.householdId, weekStart),
    prisma.user.findMany({
      where: { householdId: user.householdId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="pb-8">
      <ScreenHeader
        eyebrow={`На неделю · ${formatWeekRange(weekStart)}`}
        title="Список покупок"
      />

      {members.length > 1 && (
        <div className="-mt-2 mb-4 flex items-center gap-[7px] text-xs font-medium text-muted-foreground">
          <span className="flex">
            {members.slice(0, 3).map((member, index) => (
              <span
                key={member.id}
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border-2 border-background text-[9px] font-extrabold text-primary-foreground",
                  index > 0 && "-ml-1.5",
                  AVATAR_CLASSES[index % AVATAR_CLASSES.length],
                )}
              >
                {member.name.charAt(0).toUpperCase()}
              </span>
            ))}
          </span>
          <span>Общий список семьи · синхронизируется</span>
        </div>
      )}

      <ShoppingListBoard items={items} today={today} weekStart={weekStart} />
      <ShoppingListRealtime householdId={user.householdId} />
      <OfflineSnapshot
        householdId={user.householdId}
        snapshot={{ table: "shoppingLists", id: weekStart, data: { weekStart, items } }}
      />
    </div>
  );
}
