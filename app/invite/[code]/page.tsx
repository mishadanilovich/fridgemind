import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { acceptInvite } from "@/app/actions/invite";

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const household = await prisma.household.findUnique({ where: { inviteCode: code } });

  if (!household) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center space-y-3 px-4 py-8 text-center">
        <h1 className="font-heading text-2xl font-bold">Приглашение не найдено</h1>
        <p className="text-sm text-muted-foreground">Ссылка недействительна или была обновлена.</p>
        <Link href="/" className="text-sm font-semibold text-primary">
          На главную
        </Link>
      </main>
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/signup?invite=${code}`);
  }

  if (user.householdId === household.id) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center space-y-5 px-4 py-8">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-2xl font-bold">Присоединиться к семье?</h1>
        <p className="text-sm text-muted-foreground">
          Вы уже состоите в другой семье. Присоединение к «{household.name ?? "новой семье"}» заменит
          её — данные текущей семьи останутся у её участников.
        </p>
      </div>

      <form action={acceptInvite.bind(null, code)}>
        <button
          type="submit"
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Присоединиться
        </button>
      </form>

      <Link href="/" className="text-center text-sm font-semibold text-primary">
        Остаться в текущей семье
      </Link>
    </main>
  );
}
