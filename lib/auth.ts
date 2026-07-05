import { NextResponse } from "next/server";
import { cache } from "react";

import { prisma } from "./prisma";
import { createSupabaseServerClient } from "./supabase";
import type { User } from "./types";

export { hasRole } from "./roles";

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

export function unauthorized() {
  return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });
}
