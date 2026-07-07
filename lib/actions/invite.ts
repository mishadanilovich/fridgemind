"use server";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { canLeaveHousehold } from "@/lib/household-rules";
import { prisma } from "@/lib/prisma";

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
    // Тот же инвариант, что у leaveHousehold: единственный Организатор семьи из нескольких
    // человек не может уйти (в т.ч. через приглашение), не назначив Организатором кого-то ещё.
    // Одиночный household (members.length <= 1) не блокируем — соло-пользователь, принимающий
    // приглашение в семью, это основной сценарий; его прежний household просто осиротеет.
    const members = await prisma.user.findMany({
      where: { householdId: user.householdId },
      select: { id: true, role: true },
    });
    const check = canLeaveHousehold(user.id, members);
    if (!check.allowed && members.length > 1) {
      redirect(`/invite/${code}?error=cannot-leave`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { householdId: household.id, role: "MEMBER" },
    });
  }

  redirect("/");
}
