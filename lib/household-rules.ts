// Чистые правила household — инвариант "хотя бы один Организатор" и условия выхода
// (см. CLAUDE.md, раздел 5 "Роли в household"). Выделены отдельно от server actions,
// чтобы покрывать юнит-тестами (см. раздел 10, "Тесты").

import type { HouseholdRole } from "./types";

export type HouseholdMember = { id: string; role: HouseholdRole };

export function organizerCount(members: HouseholdMember[]): number {
  return members.filter((m) => m.role === "ORGANIZER").length;
}

/**
 * Может ли пользователь покинуть household. Нельзя, если он единственный участник
 * (некуда выходить — это удаление аккаунта, вне MVP) или единственный Организатор
 * при наличии других участников (тогда управлять составом станет некому).
 */
export function canLeaveHousehold(
  userId: string,
  members: HouseholdMember[],
): { allowed: boolean; reason?: string } {
  if (members.length <= 1) {
    return { allowed: false, reason: "Вы единственный участник семьи — покидать некого." };
  }
  const user = members.find((m) => m.id === userId);
  if (user?.role === "ORGANIZER" && organizerCount(members) === 1) {
    return {
      allowed: false,
      reason: "Вы единственный Организатор. Сначала назначьте Организатором кого-то ещё.",
    };
  }
  return { allowed: true };
}

/**
 * Останется ли в household хотя бы один Организатор после смены роли участника.
 * Защищает от понижения последнего Организатора до Редактора/Участника.
 */
export function wouldKeepOrganizer(
  members: HouseholdMember[],
  targetUserId: string,
  newRole: HouseholdRole,
): boolean {
  const after = members.map((m) => (m.id === targetUserId ? { ...m, role: newRole } : m));
  return organizerCount(after) >= 1;
}
