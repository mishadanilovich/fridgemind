import { cva, type VariantProps } from "class-variance-authority"
import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-semibold",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        // Тёплый тон из макета — способы готовки, совпадение с запасами.
        warm: "border-badge-border bg-badge text-badge-foreground",
        success: "border-success-border bg-success text-success-foreground",
        // Оранжевый тинт из макета — низкое совпадение с запасами.
        warning: "border-transparent bg-accent-muted text-destructive",
        destructiveMuted: "border-destructive-border bg-destructive-muted text-destructive",
        muted: "border-transparent bg-secondary text-muted-foreground",
        // Нейтральный чип на карточном фоне — ингредиенты рецепта.
        chip: "border-border bg-card text-foreground",
        // Оранжевая метка — время приготовления.
        accent: "border-transparent bg-accent/10 text-accent",
      },
      size: {
        sm: "px-2.5 py-0.5 text-xs",
        md: "px-3 py-1 text-xs",
        lg: "px-3 py-[7px] text-[12.5px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
)

export type BadgeProps = {} & HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
