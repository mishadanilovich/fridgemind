import { RoleBadge } from "@/components/profile/RoleBadge";
import { Avatar } from "@/components/ui/avatar";
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
        // Контролы (смена роли, удаление) — только у Организатора и только над другими.
        const showControls = viewerIsOrganizer && !isSelf;

        return (
          <li key={member.id} className="flex items-center gap-3">
            <Avatar name={member.name} />
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
