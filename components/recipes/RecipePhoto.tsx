import { CookingPot } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

type Props = {
  photoUrl: string | null;
  alt?: string;
  /** Размеры и скругление задаёт вызывающий (`size-[82px] rounded-lg`, `h-12 w-full`, ...). */
  className?: string;
  /** Натуральные размеры для оптимизации next/image; не нужны в режиме fill. */
  width?: number;
  height?: number;
  /** Растянуть на весь родитель с position: relative — герой-фото карточки приёма пищи. */
  fill?: boolean;
  sizes?: string;
  iconClassName?: string;
};

/** Фото рецепта, а если его нет — заглушка с кастрюлей (карточки, шторка выбора, меню). */
export function RecipePhoto({
  photoUrl,
  alt = "",
  className,
  width,
  height,
  fill,
  sizes,
  iconClassName = "size-6",
}: Props) {
  if (!photoUrl) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center bg-secondary text-muted-foreground",
          fill && "size-full",
          className,
        )}
      >
        <CookingPot className={iconClassName} />
      </span>
    );
  }

  if (fill) {
    return (
      <Image src={photoUrl} alt={alt} fill sizes={sizes} className={cn("object-cover", className)} />
    );
  }

  return (
    <Image
      src={photoUrl}
      alt={alt}
      width={width}
      height={height}
      className={cn("shrink-0 object-cover", className)}
    />
  );
}
