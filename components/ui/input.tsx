import { type ComponentProps, forwardRef } from "react"

import { cn } from "@/lib/utils"

type InputProps = ComponentProps<"input"> & {
  /** Текст ошибки поля — подсвечивает рамку и выводится под инпутом. */
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    const input = (
      <input
        type={type}
        aria-invalid={error ? true : undefined}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        {...props}
      />
    )
    if (!error) return input
    return (
      <>
        {input}
        <p className="mt-1.5 text-sm font-medium text-destructive">{error}</p>
      </>
    )
  }
)
Input.displayName = "Input"

export { Input }
