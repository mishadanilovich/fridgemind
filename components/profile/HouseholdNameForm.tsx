"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { renameHousehold } from "@/lib/actions/household";
import { initialFormState } from "@/lib/form-state";

type Props = {
  name: string | null;
};

export function HouseholdNameForm({ name }: Props) {
  const [state, formAction, isPending] = useActionState(renameHousehold, initialFormState);

  return (
    <form action={formAction} className="space-y-1.5">
      <Label htmlFor="household-name">Название семьи</Label>
      <div className="flex gap-2">
        <Input
          id="household-name"
          name="name"
          type="text"
          maxLength={60}
          placeholder="Ваша семья"
          defaultValue={state.values?.name ?? name ?? ""}
        />
        <Button type="submit" variant="outline" loading={isPending}>
          Сохранить
        </Button>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
