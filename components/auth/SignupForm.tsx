"use client";

import Link from "next/link";
import { useActionState } from "react";

import { type AuthFormState, signUp } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthFormState = { error: null };

type Props = {
  inviteCode?: string;
};

export function SignupForm({ inviteCode }: Props) {
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  if (state.sentTo) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Проверьте почту</h1>
        <p className="text-sm text-muted-foreground">
          Мы отправили письмо со ссылкой для подтверждения на{" "}
          <span className="font-medium">{state.sentTo}</span>. Перейдите по ней, чтобы завершить
          регистрацию.
        </p>
        <Link href="/login" className="inline-block text-sm font-semibold text-primary">
          Вернуться ко входу
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold">FridgeMind</h1>
        <p className="text-sm text-muted-foreground">
          {inviteCode ? "Регистрация и присоединение к семье" : "Создание аккаунта"}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {inviteCode && <input type="hidden" name="inviteCode" value={inviteCode} />}

        <div className="space-y-1.5">
          <Label htmlFor="name">Имя</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            defaultValue={state.values?.name}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={state.values?.email}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Создаём…" : "Зарегистрироваться"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Войти
        </Link>
      </p>
    </div>
  );
}
