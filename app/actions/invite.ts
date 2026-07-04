"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function acceptInvite(code: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=/invite/${code}`);
  }

  const household = await prisma.household.findUnique({ where: { inviteCode: code } });
  if (!household) {
    redirect(`/invite/${code}`);
  }

  if (household.id !== user.householdId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { householdId: household.id, role: "MEMBER" },
    });
  }

  redirect("/");
}
