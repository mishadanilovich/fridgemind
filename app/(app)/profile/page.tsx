// Экран "Профиль / Настройки" (см. CLAUDE.md, раздел 6 + раздел 5 "Роли в household").
// Роли определяют, что доступно: приглашение/смена ролей/удаление — только Организатору;
// управление слотами — Организатору и Редактору; имя/выход — всем. Все ограничения
// продублированы на бэкенде (server actions), UI лишь скрывает недоступное.

import { redirect } from "next/navigation";

import { DangerZone } from "@/components/profile/DangerZone";
import { HouseholdNameForm } from "@/components/profile/HouseholdNameForm";
import { InviteSection } from "@/components/profile/InviteSection";
import { MealSlotsManager } from "@/components/profile/MealSlotsManager";
import { MembersList } from "@/components/profile/MembersList";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { SettingsSection } from "@/components/profile/SettingsSection";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { canLeaveHousehold } from "@/lib/household-rules";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const household = await prisma.household.findUnique({
    where: { id: user.householdId },
    include: {
      users: { orderBy: { createdAt: "asc" } },
      mealSlots: { where: { deletedAt: null }, orderBy: { order: "asc" } },
    },
  });
  if (!household) redirect("/login");

  const isOrganizer = hasRole(user, ["ORGANIZER"]);
  const canManageSlots = hasRole(user, ["ORGANIZER", "EDITOR"]);
  const leaveCheck = canLeaveHousehold(
    user.id,
    household.users.map((u) => ({ id: u.id, role: u.role })),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Профиль / Настройки</h1>

      <ProfileHeader name={user.name} email={user.email} />

      <SettingsSection title="Семья">
        {isOrganizer ? (
          <HouseholdNameForm name={household.name} />
        ) : (
          <div className="space-y-0.5">
            <p className="text-sm text-muted-foreground">Название семьи</p>
            <p className="font-medium">{household.name ?? "Ваша семья"}</p>
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        title="Участники"
        description={isOrganizer ? "Меняйте роли и состав семьи" : undefined}
      >
        <MembersList
          members={household.users}
          currentUserId={user.id}
          viewerIsOrganizer={isOrganizer}
        />
        {isOrganizer && <InviteSection inviteCode={household.inviteCode} />}
      </SettingsSection>

      {canManageSlots && (
        <SettingsSection
          title="Приёмы пищи"
          description="Порядок задаёт, как слоты показываются в «Сегодня» и «Меню на неделю»"
        >
          <MealSlotsManager
            slots={household.mealSlots.map((s) => ({ id: s.id, name: s.name }))}
          />
        </SettingsSection>
      )}

      <SettingsSection title="Аккаунт">
        <DangerZone canLeave={leaveCheck.allowed} leaveReason={leaveCheck.reason} />
      </SettingsSection>
    </div>
  );
}
