import type { HouseholdRole } from "./types";

export function hasRole(user: { role: HouseholdRole }, roles: HouseholdRole[]): boolean {
  return roles.includes(user.role);
}
