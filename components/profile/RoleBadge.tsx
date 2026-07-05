import { Badge, type BadgeProps } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/roles";
import type { HouseholdRole } from "@/lib/types";

const ROLE_VARIANT: Record<HouseholdRole, BadgeProps["variant"]> = {
  ORGANIZER: "default",
  EDITOR: "secondary",
  MEMBER: "outline",
};

type Props = {
  role: HouseholdRole;
};

export function RoleBadge({ role }: Props) {
  return <Badge variant={ROLE_VARIANT[role]}>{ROLE_LABELS[role]}</Badge>;
}
