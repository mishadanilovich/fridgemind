"use client";

import { Check, Copy, RefreshCw, Share2, UserPlus } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { regenerateInviteCode } from "@/lib/actions/household";

type Props = {
  inviteCode: string;
};

export function InviteSection({ inviteCode }: Props) {
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Origin и наличие Web Share API читаем после монтирования — иначе рассинхрон с SSR.
  useEffect(() => {
    setOrigin(window.location.origin);
    setCanShare(typeof navigator !== "undefined" && Boolean(navigator.share));
  }, []);

  // inviteCode — единственный источник истины: после регенерации revalidatePath приносит
  // свежий проп, ссылка обновляется сама, без локального состояния кода.
  const link = origin ? `${origin}/invite/${inviteCode}` : "";

  async function onCopy() {
    if (!link) return;
    try {
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(link);
      setError(null);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Не удалось скопировать. Скопируйте ссылку вручную.");
    }
  }

  async function onShare() {
    if (!link) return;
    try {
      await navigator.share({ title: "FridgeMind", text: "Присоединяйтесь к нашей семье", url: link });
    } catch {
      // Пользователь отменил шаринг — ничего не делаем.
    }
  }

  function onRegenerate() {
    setError(null);
    startTransition(async () => {
      const result = await regenerateInviteCode();
      if (result.error) setError(result.error);
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="accent" className="w-full" icon={<UserPlus />}>
        Пригласить
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <p className="text-sm font-medium">Ссылка-приглашение</p>
      <div className="flex gap-2">
        <Input readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
        <Button variant="outline" size="icon" onClick={onCopy} aria-label="Скопировать ссылку">
          {copied ? <Check /> : <Copy />}
        </Button>
        {canShare && (
          <Button variant="outline" size="icon" onClick={onShare} aria-label="Поделиться ссылкой">
            <Share2 />
          </Button>
        )}
      </div>
      {copied && <p className="text-xs text-muted-foreground">Ссылка скопирована</p>}
      <p className="text-xs text-muted-foreground">
        Любой, кто перейдёт по ссылке, присоединится к вашей семье как Участник.
      </p>

      <Button
        variant="ghost"
        size="sm"
        onClick={onRegenerate}
        loading={isPending}
        icon={<RefreshCw />}
      >
        Сгенерировать новую ссылку
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
