import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { cache } from "react";

import { prisma } from "./prisma";
import { hasRole } from "./roles";
import { createSupabaseServerClient } from "./supabase";
import type { HouseholdRole, User } from "./types";

export { hasRole };

export const getAuthUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const authUser = await getAuthUser();
  if (!authUser) return null;
  return prisma.user.findUnique({ where: { id: authUser.id } });
});

// Требует залогиненного пользователя с одной из ролей. Не залогинен → redirect на /login;
// роль не подходит → null (вызывающий экшен возвращает свою ошибку "Недостаточно прав").
export async function requireRole(roles: HouseholdRole[]): Promise<User | null> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return hasRole(user, roles) ? user : null;
}

// Требует просто залогиненного пользователя — для действий, доступных всем ролям household
// (инвентарь, список покупок). Не залогинен → redirect на /login.
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function unauthorized() {
  return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
}
