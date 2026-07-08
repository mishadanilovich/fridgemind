"use client";

import { DoorOpen, LogOut } from "lucide-react";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";
import { leaveHousehold } from "@/lib/actions/household";

type Props = {
  canLeave: boolean;
  leaveReason?: string;
};

export function DangerZone({ canLeave, leaveReason }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onLeave() {
    setError(null);
    startTransition(async () => {
      // При успехе экшен делает redirect и сюда не возвращается.
      const result = await leaveHousehold();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-3">
      <div>
        {canLeave ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="terracotta"
                className="w-full"
                loading={isPending}
                icon={<DoorOpen />}
              >
                Покинуть семью
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Покинуть семью?</AlertDialogTitle>
                <AlertDialogDescription>
                  Вы перейдёте в собственную пустую семью. Общие рецепты, меню, инвентарь и список
                  покупок останутся у прежней семьи.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onLeave}
                  className={buttonVariants({ variant: "destructive" })}
                >
                  Покинуть
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <>
            <Button variant="outline" className="w-full" disabled icon={<DoorOpen />}>
              Покинуть семью
            </Button>
            {leaveReason && <p className="mt-1 text-xs text-muted-foreground">{leaveReason}</p>}
          </>
        )}
        {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
      </div>

      <form action={signOut}>
        <Button
          type="submit"
          variant="ghost"
          className="w-full text-muted-foreground"
          icon={<LogOut />}
        >
          Выйти из аккаунта
        </Button>
      </form>
    </div>
  );
}
