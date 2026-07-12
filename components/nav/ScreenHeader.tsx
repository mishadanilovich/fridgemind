import Link from "next/link";
import type { ReactNode } from "react";

import { getCurrentUser } from "@/lib/auth";

type Props = {
  eyebrow: string;
  title: string;
  /** Блок слева от аватара — например, счётчик "1/3 приёмов" на экране "Сегодня". */
  aside?: ReactNode;
};

export async function ScreenHeader({ eyebrow, title, aside }: Props) {
  const user = await getCurrentUser();
  const initial = user?.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="mb-4 flex items-start justify-between gap-2.5">
      <div>
        <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-accent">
          {eyebrow}
        </div>
        <h1 className="mt-1 font-heading text-[34px] font-bold leading-[1.05] text-foreground">
          {title}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        {aside}
        <Link
          href="/profile"
          aria-label="Профиль"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-primary font-heading text-lg font-extrabold text-primary-foreground"
        >
          {initial}
        </Link>
      </div>
    </div>
  );
}
