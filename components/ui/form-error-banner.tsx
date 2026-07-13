import { cn } from "@/lib/utils";

type Props = {
  message?: string | null;
  className?: string;
};

export function FormErrorBanner({ message, className }: Props) {
  if (!message) return null;
  return (
    <div
      className={cn(
        "mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive",
        className,
      )}
    >
      {message}
    </div>
  );
}
