import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "flex shrink-0 items-center justify-center rounded-full font-heading font-extrabold",
  {
    variants: {
      size: {
        sm: "size-10 text-[15px]",
        lg: "size-[60px] text-[26px]",
      },
      tone: {
        primary: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
      },
    },
    defaultVariants: {
      size: "sm",
      tone: "secondary",
    },
  },
);

type Props = {
  name: string;
  className?: string;
} & VariantProps<typeof avatarVariants>;

// Аватар — первая буква имени (без загрузки фото в MVP, см. раздел 6).
export function Avatar({ name, size, tone, className }: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return <div className={cn(avatarVariants({ size, tone }), className)}>{initial}</div>;
}
