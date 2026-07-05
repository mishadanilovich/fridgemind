import { RoleBadge } from "@/components/profile/RoleBadge";
import type { User } from "@/lib/types";

import { MemberControls } from "./MemberControls";

type Props = {
  members: User[];
  currentUserId: string;
  viewerIsOrganizer: boolean;
};

export function MembersList({ members, currentUserId, viewerIsOrganizer }: Props) {
  return (
    <ul className="space-y-3">
      {members.map((member) => {
        const isSelf = member.id === currentUserId;
        const initial = member.name.trim().charAt(0).toUpperCase() || "?";
        // Контролы (смена роли, удаление) — только у Организатора и только над другими.
        const showControls = viewerIsOrganizer && !isSelf;

        return (
          <li key={member.id} className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {member.name}
                {isSelf && <span className="text-muted-foreground"> · вы</span>}
              </p>
              <p className="truncate text-xs text-muted-foreground">{member.email}</p>
            </div>
            {showControls ? (
              <MemberControls userId={member.id} name={member.name} role={member.role} />
            ) : (
              <RoleBadge role={member.role} />
            )}
          </li>
        );
      })}
    </ul>
  );
}
