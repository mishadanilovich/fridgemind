import type { HouseholdRole } from "./types";

export function hasRole(user: { role: HouseholdRole }, roles: HouseholdRole[]): boolean {
  return roles.includes(user.role);
}

// Локализованные названия ролей — общие для бейджей и селекта смены роли (сервер + клиент).
export const ROLE_LABELS: Record<HouseholdRole, string> = {
  ORGANIZER: "Организатор",
  EDITOR: "Редактор",
  MEMBER: "Участник",
};

// Роли, которые можно назначить участнику через селект (порядок = убыванию прав).
export const ASSIGNABLE_ROLES: HouseholdRole[] = ["ORGANIZER", "EDITOR", "MEMBER"];
