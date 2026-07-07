import type { HouseholdRole } from "./types";

export function hasRole(user: { role: HouseholdRole }, roles: HouseholdRole[]): boolean {
  return roles.includes(user.role);
}

// Локализованные названия ролей — общие для бейджей и селекта смены роли (сервер + клиент).
// Порядок ключей = убыванию прав; из него же выводим список назначаемых ролей, чтобы не
// держать третий параллельный список ролей.
export const ROLE_LABELS: Record<HouseholdRole, string> = {
  ORGANIZER: "Организатор",
  EDITOR: "Редактор",
  MEMBER: "Участник",
};

// Роли, которые можно назначить участнику через селект (порядок = ROLE_LABELS).
export const ASSIGNABLE_ROLES = Object.keys(ROLE_LABELS) as HouseholdRole[];
