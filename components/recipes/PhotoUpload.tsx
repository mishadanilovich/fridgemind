"use client";

import { Camera, Loader2, X } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, useState } from "react";

import { uploadRecipePhoto } from "@/lib/actions/uploads";
import { compressImage } from "@/lib/compress-image";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  variant: "cover" | "step";
};

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
            <label className="pressable flex-1 cursor-pointer rounded-xl bg-background/90 py-2.5 text-center text-[12.5px] font-bold text-primary backdrop-blur">
              Заменить
              <input type="file" accept="image/*" onChange={onSelect} className="hidden" />
            </label>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="pressable flex-1 rounded-xl bg-destructive/90 py-2.5 text-[12.5px] font-bold text-white"
            >
              Убрать
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Убрать фото шага"
            className="pressable absolute right-2 top-2 flex size-7 items-center justify-center rounded-lg bg-foreground/60 text-white backdrop-blur"
          >
            <X className="size-4" />
          </button>
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
          <input type="file" accept="image/*" onChange={onSelect} className="hidden" />
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
        <input type="file" accept="image/*" onChange={onSelect} className="hidden" />
      </label>
      {error && <p className="mt-1.5 text-sm font-medium text-destructive">{error}</p>}
    </>
  );
}
