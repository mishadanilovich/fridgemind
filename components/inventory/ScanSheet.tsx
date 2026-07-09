"use client";

import { Camera, Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, useRef, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { confirmRecognizedProducts } from "@/lib/actions/pantry";
import { compressImage } from "@/lib/compress-image";
import type { RecognizedProduct, Unit } from "@/lib/types";
import { formatQuantity } from "@/lib/units";

import { CategoryDot } from "./CategoryDot";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ScanPhoto = { key: string; file: File; previewUrl: string };
type ScanItem = RecognizedProduct & { key: string };

const MAX_PHOTOS = 5;

// Шаг степпера на экране проверки — грубые деления под "примерную оценку" количества.
const QUANTITY_STEP: Record<Unit, number> = { G: 50, ML: 100, PCS: 1 };

const uid = () => crypto.randomUUID();

export function ScanSheet({ open, onOpenChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<"capture" | "confirm">("capture");
  const [photos, setPhotos] = useState<ScanPhoto[]>([]);
  const [items, setItems] = useState<ScanItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isSaving, startSave] = useTransition();

  function reset() {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPhase("capture");
    setPhotos([]);
    setItems([]);
    setError(null);
  }

  function close(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function onPickFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // разрешаем повторный выбор того же файла
    if (files.length === 0) return;
    setError(null);
    setPhotos((prev) => {
      const room = MAX_PHOTOS - prev.length;
      if (files.length > room) setError(`Не больше ${MAX_PHOTOS} фото за раз`);
      const added = files.slice(0, Math.max(0, room)).map((file) => ({
        key: uid(),
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      return [...prev, ...added];
    });
  }

  function removePhoto(key: string) {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.key === key);
      if (photo) URL.revokeObjectURL(photo.previewUrl);
      return prev.filter((p) => p.key !== key);
    });
  }

  async function recognize() {
    setError(null);
    setIsRecognizing(true);
    try {
      const fd = new FormData();
      for (const photo of photos) {
        fd.append("photos", await compressImage(photo.file));
      }
      const res = await fetch("/api/pantry/photo", { method: "POST", body: fd });
      const json: { products?: RecognizedProduct[]; error?: string } = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Не удалось распознать продукты");
        return;
      }
      const products = json.products ?? [];
      if (products.length === 0) {
        setError("Продукты на фото не нашлись — попробуйте снять ближе или при лучшем свете");
        return;
      }
      setItems(products.map((p) => ({ ...p, key: uid() })));
      setPhase("confirm");
    } catch {
      setError("Не удалось отправить фото. Проверьте соединение.");
    } finally {
      setIsRecognizing(false);
    }
  }

  function changeQuantity(key: string, direction: 1 | -1) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const step = QUANTITY_STEP[item.unit];
        return { ...item, quantity: Math.max(step, item.quantity + direction * step) };
      }),
    );
  }

  function confirm() {
    setError(null);
    startSave(async () => {
      // Клиентский key уходит вместе с продуктом — Zod-схема на сервере отбросит лишнее поле.
      const result = await confirmRecognizedProducts({ products: items });
      if (result.error !== null) {
        setError(result.error);
        return;
      }
      reset();
      onOpenChange(false);
    });
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={close}
      eyebrow={phase === "confirm" ? `${photos.length} фото` : undefined}
      title={phase === "capture" ? "Сфотографируйте запасы" : "Проверьте продукты"}
      description={
        phase === "capture"
          ? "Холодильник, морозилку, полки — можно несколько фото за раз."
          : "Поправьте количество или удалите лишнее."
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onPickFiles}
        className="hidden"
      />

      {phase === "capture" ? (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Сделать или выбрать фото"
            className="pressable relative flex h-[168px] w-full items-center justify-center overflow-hidden rounded-card bg-primary"
          >
            <span className="absolute left-3.5 top-3.5 size-[22px] rounded-tl-md border-l-[2.5px] border-t-[2.5px] border-primary-foreground/75" />
            <span className="absolute right-3.5 top-3.5 size-[22px] rounded-tr-md border-r-[2.5px] border-t-[2.5px] border-primary-foreground/75" />
            <span className="absolute bottom-3.5 left-3.5 size-[22px] rounded-bl-md border-b-[2.5px] border-l-[2.5px] border-primary-foreground/75" />
            <span className="absolute bottom-3.5 right-3.5 size-[22px] rounded-br-md border-b-[2.5px] border-r-[2.5px] border-primary-foreground/75" />
            <span className="flex size-[62px] items-center justify-center rounded-full bg-background shadow-card">
              <Camera className="size-[27px] text-primary" />
            </span>
          </button>

          <div className="mt-3 min-h-[84px]">
            {photos.length === 0 ? (
              <p className="px-0.5 py-1 text-[12.5px] font-medium text-nav-inactive">
                Фото ещё нет — нажмите на область съёмки выше
              </p>
            ) : (
              <div className="flex gap-2.5 overflow-x-auto pb-1.5">
                {photos.map((photo, index) => (
                  <div key={photo.key} className="relative w-16 shrink-0">
                    <Image
                      src={photo.previewUrl}
                      alt={`Фото ${index + 1}`}
                      width={64}
                      height={64}
                      unoptimized
                      className="size-16 rounded-xl border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.key)}
                      aria-label={`Убрать фото ${index + 1}`}
                      className="pressable absolute -right-1.5 -top-1.5 flex size-[22px] items-center justify-center rounded-full border-2 border-background bg-destructive text-destructive-foreground"
                    >
                      <X className="size-[11px]" strokeWidth={2.6} />
                    </button>
                    <div className="mt-1 truncate text-center text-[9.5px] font-semibold text-muted-foreground">
                      Фото {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <FieldError message={error} />

          <div className="mt-3 flex gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="block"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-card font-bold text-primary"
            >
              + Ещё фото
            </Button>
            <Button
              type="button"
              size="block"
              disabled={photos.length === 0}
              loading={isRecognizing}
              onClick={recognize}
              className="flex-1 font-bold"
            >
              Готово, распознать
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="max-h-[45vh] overflow-y-auto rounded-card border border-border bg-card">
            {items.map((item) => (
              <div
                key={item.key}
                className="flex items-center gap-2.5 border-b border-secondary px-3.5 py-2.5 last:border-b-0"
              >
                <CategoryDot category={item.category} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                  {item.name}
                  {item.matchedIngredientId === null && (
                    <Badge variant="warm" size="sm" className="ml-1.5 align-middle">
                      новый
                    </Badge>
                  )}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="iconSm"
                  aria-label="Меньше"
                  onClick={() => changeQuantity(item.key, -1)}
                  className="size-7 shrink-0 rounded-sm bg-background text-primary"
                >
                  <Minus />
                </Button>
                <span className="min-w-[52px] shrink-0 text-center text-[13px] font-bold text-foreground">
                  {formatQuantity(item.quantity, item.unit)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="iconSm"
                  aria-label="Больше"
                  onClick={() => changeQuantity(item.key, 1)}
                  className="size-7 shrink-0 rounded-sm bg-background text-primary"
                >
                  <Plus />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="iconSm"
                  aria-label={`Убрать «${item.name}»`}
                  onClick={() => setItems((prev) => prev.filter((i) => i.key !== item.key))}
                  className="size-7 shrink-0 text-destructive"
                >
                  <X />
                </Button>
              </div>
            ))}
            {items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Всё убрали — вернитесь назад и снимите ещё раз
              </p>
            )}
          </div>

          <FieldError message={error} />

          <div className="mt-4 flex gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="block"
              onClick={() => {
                setError(null);
                setPhase("capture");
              }}
              className="shrink-0 bg-card font-bold text-muted-foreground"
            >
              Назад
            </Button>
            <Button
              type="button"
              size="block"
              disabled={items.length === 0}
              loading={isSaving}
              onClick={confirm}
              className="flex-1 font-bold"
            >
              Добавить {items.length} в запасы
            </Button>
          </div>
        </>
      )}
    </BottomSheet>
  );
}
