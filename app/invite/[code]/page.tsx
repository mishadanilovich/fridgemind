import Link from "next/link";
import { redirect } from "next/navigation";

import { SubmitButton } from "@/components/ui/submit-button";
import { acceptInvite } from "@/lib/actions/invite";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = PageProps<"/invite/[code]">;

export default async function InvitePage({ params, searchParams }: Props) {
  const { code } = await params;
  const { error } = await searchParams;
  const household = await prisma.household.findUnique({
    where: { inviteCode: code },
  });

  if (!household) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center space-y-3 px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Приглашение не найдено</h1>
        <p className="text-sm text-muted-foreground">
          Ссылка недействительна или была обновлена.
        </p>
        <Link href="/" className="text-sm font-semibold text-primary">
          На главную
        </Link>
      </main>
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center space-y-5 px-4 py-8 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Приглашение в семью «{household.name ?? "Наша кухня"}»</h1>
          <p className="text-sm text-muted-foreground">
            Войдите, если у вас уже есть аккаунт, или зарегистрируйтесь, чтобы присоединиться.
          </p>
        </div>

        <div className="space-y-2">
          <Link
            href={`/login?next=/invite/${code}`}
            className="block w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Войти
          </Link>
          <Link
            href={`/signup?invite=${code}`}
            className="block w-full rounded-md border border-border px-4 py-2 text-sm font-semibold"
          >
            Зарегистрироваться
          </Link>
        </div>
      </main>
    );
  }

  if (user.householdId === household.id) {
    redirect("/");
  }

  if (error === "cannot-leave") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center space-y-3 px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Сначала назначьте Организатора</h1>
        <p className="text-sm text-muted-foreground">
          Вы единственный Организатор своей текущей семьи. Назначьте Организатором кого-то ещё
          в профиле, иначе после ухода семья останется без управления.
        </p>
        <Link href="/" className="text-sm font-semibold text-primary">
          На главную
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center space-y-5 px-4 py-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Присоединиться к семье?</h1>
        <p className="text-sm text-muted-foreground">
          Вы уже состоите в другой семье. Присоединение к «
          {household.name ?? "новой семье"}» заменит её — данные текущей семьи
          останутся у её участников.
        </p>
      </div>

      <form action={acceptInvite.bind(null, code)}>
        <SubmitButton className="w-full">Присоединиться</SubmitButton>
      </form>

      <Link href="/" className="text-center text-sm font-semibold text-primary">
        Остаться в текущей семье
      </Link>
    </main>
  );
}
