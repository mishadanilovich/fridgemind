import { NextResponse } from "next/server";

import { forbidden, getCurrentUser, hasRole, unauthorized } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Регенерация inviteCode — только ORGANIZER (см. CLAUDE.md, раздел 5).
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ["ORGANIZER"])) return forbidden();

  const household = await prisma.household.update({
    where: { id: user.householdId },
    data: { inviteCode: crypto.randomUUID() },
  });

  return NextResponse.json({ inviteCode: household.inviteCode });
}

// Валидация кода приглашения (используется лендингом /invite/[code]).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }

  const household = await prisma.household.findUnique({
    where: { inviteCode: code },
    select: { id: true, name: true },
  });

  return NextResponse.json({ valid: Boolean(household), household });
}
