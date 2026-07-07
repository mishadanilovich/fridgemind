import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "pressable inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        accent: "bg-accent text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-transparent",
        secondary: "bg-secondary text-secondary-foreground",
        ghost: "",
        ghostDestructive: "text-destructive",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonBaseProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>

// asChild рендерит через Slot (<a> и т.п.), где спиннер/иконка не выводятся, а disabled —
// no-op. Разводим варианты discriminated union'ом, чтобы <Button asChild loading icon>
// падало на компиляции, а не молча (латентный double-submit).
export type ButtonProps = ButtonBaseProps &
  (
    | { asChild: true; loading?: never; icon?: never }
    | {
        asChild?: false
        loading?: boolean
        /** Ведущая иконка; при loading заменяется спиннером. */
        icon?: ReactNode
      }
  )

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      icon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading ? <Loader2 className="animate-spin" /> : icon}
            {children}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
