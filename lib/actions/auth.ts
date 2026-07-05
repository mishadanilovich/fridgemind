"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { firstIssue, type FormState } from "@/lib/form-state";
import { createSupabaseServerClient } from "@/lib/supabase";
import { loginFormSchema, signupFormSchema } from "@/lib/zod-schemas";

export type AuthFormState = FormState<{ email: string; name: string }, { sentTo: string }>;

export async function signIn(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const next = String(formData.get("next") ?? "");

  const parsed = loginFormSchema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) {
    return { error: firstIssue(parsed.error.issues), values: { email } };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    const message =
      error.message === "Invalid login credentials" ? "Неверный email или пароль" : error.message;
    return { error: message, values: { email } };
  }

  // Открытый редирект наружу не допускаем — только внутренние пути.
  redirect(next.startsWith("/") ? next : "/");
}

export async function signUp(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const name = String(formData.get("name") ?? "");

  const parsed = signupFormSchema.safeParse({
    email,
    name,
    password: formData.get("password"),
    inviteCode: formData.get("inviteCode") || undefined,
  });
  if (!parsed.success) {
    return { error: firstIssue(parsed.error.issues), values: { email, name } };
  }

  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ??
    `${process.env.NODE_ENV === "development" ? "http" : "https"}://${headerStore.get("host")}`;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: parsed.data.inviteCode
        ? { name: parsed.data.name, inviteCode: parsed.data.inviteCode }
        : { name: parsed.data.name },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message, values: { email, name } };
  }

  if (data.session) {
    redirect("/");
  }

  return { error: null, data: { sentTo: parsed.data.email } };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
