"use client";

import { Camera, Loader2, X } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadRecipePhoto } from "@/lib/actions/uploads";
import { compressImage } from "@/lib/compress-image";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  variant: "cover" | "step";
};

// Скрытый файловый инпут (примитив Input) внутри <label> — стандартный паттерн выбора файла;
// сам <label> — не кнопка/инпут, а обёртка-триггер, поэтому остаётся как есть.
function FileInput({ onSelect }: { onSelect: (e: ChangeEvent<HTMLInputElement>) => void }) {
  return <Input type="file" accept="image/*" onChange={onSelect} className="hidden" />;
}

export function PhotoUpload({ value, onChange, variant }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // разрешаем повторный выбор того же файла
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append("file", compressed);
      const result = await uploadRecipePhoto(fd);
      if (result.error !== null) setError(result.error);
      else onChange(result.url);
    } catch {
      setError("Не удалось обработать фото");
    } finally {
      setUploading(false);
    }
  }

  const box = variant === "cover" ? "h-[168px] rounded-[20px]" : "h-[120px] rounded-xl";

  if (uploading) {
    return (
      <div
        className={`flex ${box} items-center justify-center border border-border bg-card text-muted-foreground`}
      >
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (value) {
    return (
      <div className={`relative overflow-hidden ${box}`}>
        <Image src={value} alt="" fill sizes="(max-width: 448px) 100vw, 448px" className="object-cover" />
        {variant === "cover" ? (
          <div className="absolute inset-x-2.5 bottom-2.5 flex gap-2">
            <Button
              asChild
              variant="ghost"
              className="h-9 flex-1 rounded-xl bg-background/90 text-[12.5px] font-bold text-primary backdrop-blur"
            >
              <label className="cursor-pointer">
                Заменить
                <FileInput onSelect={onSelect} />
              </label>
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => onChange(null)}
              className="h-9 flex-1 rounded-xl bg-destructive/90 text-[12.5px] font-bold backdrop-blur"
            >
              Убрать
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(null)}
            aria-label="Убрать фото шага"
            className="absolute right-2 top-2 size-7 rounded-lg bg-foreground/60 text-white backdrop-blur"
          >
            <X />
          </Button>
        )}
      </div>
    );
  }

  if (variant === "cover") {
    return (
      <>
        <label className="pressable flex h-[168px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[20px] border-[1.5px] border-dashed border-[hsl(var(--nav-inactive))] bg-card text-muted-foreground">
          <span className="flex size-[50px] items-center justify-center rounded-full bg-secondary">
            <Camera className="size-6" />
          </span>
          <span className="text-[13.5px] font-bold">Добавить фото</span>
          <span className="text-[11.5px] font-medium text-[hsl(var(--nav-inactive))]">
            Показывается в списке рецептов и на карточке
          </span>
          <FileInput onSelect={onSelect} />
        </label>
        {error && <p className="mt-1.5 text-sm font-medium text-destructive">{error}</p>}
      </>
    );
  }

  return (
    <>
      <label className="pressable flex cursor-pointer items-center justify-center gap-2 rounded-xl border-[1.5px] border-dashed border-[hsl(var(--nav-inactive))] py-2.5 text-[13px] font-bold text-muted-foreground">
        <Camera className="size-[18px] shrink-0" />
        Добавить фото шага
        <FileInput onSelect={onSelect} />
      </label>
      {error && <p className="mt-1.5 text-sm font-medium text-destructive">{error}</p>}
    </>
  );
}
