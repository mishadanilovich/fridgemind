"use client";

import { CloudOff, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useOnline } from "@/lib/hooks/use-online";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

// Страховочный error boundary: что бы ни осталось непойманным (в т.ч. сбои сети офлайн),
// пользователь видит понятный экран с "попробовать снова", а не голый "Application error".
export default function AppError({ reset }: Props) {
  const online = useOnline();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <CloudOff className="size-7" />
      </span>
      <div>
        <h1 className="font-heading text-[22px] font-bold text-foreground">
          {online ? "Что-то пошло не так" : "Нет соединения"}
        </h1>
        <p className="mt-1.5 text-sm font-medium text-muted-foreground">
          {online
            ? "Попробуйте ещё раз — если ошибка повторяется, перезагрузите страницу."
            : "Действие не выполнено: без интернета изменения не сохраняются. Проверьте сеть и попробуйте снова."}
        </p>
      </div>
      <Button onClick={reset} icon={<RefreshCw />} className="font-bold">
        Попробовать снова
      </Button>
    </main>
  );
}
