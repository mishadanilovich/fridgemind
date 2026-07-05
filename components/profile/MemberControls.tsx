"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { changeMemberRole, removeMember } from "@/lib/actions/household";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/lib/roles";
import type { HouseholdRole, HouseholdRoleValue } from "@/lib/types";

type Props = {
  userId: string;
  name: string;
  role: HouseholdRole;
};

export function MemberControls({ userId, name, role }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onRoleChange(value: string) {
    setError(null);
    startTransition(async () => {
      const result = await changeMemberRole(userId, value as HouseholdRoleValue);
      if (result.error) setError(result.error);
    });
  }

  function onRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeMember(userId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <Select value={role} onValueChange={onRoleChange} disabled={isPending}>
          <SelectTrigger className="h-9 w-36" aria-label={`Роль участника ${name}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSIGNABLE_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive hover:text-destructive"
              aria-label={`Удалить ${name} из семьи`}
              disabled={isPending}
            >
              <Trash2 />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить участника?</AlertDialogTitle>
              <AlertDialogDescription>
                {name} будет удалён из семьи и получит собственную пустую семью. Данные семьи
                останутся у остальных участников.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={onRemove}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
