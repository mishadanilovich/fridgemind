import Link from "next/link";
import { User } from "lucide-react";

export function ProfileLink() {
  return (
    <Link
      href="/profile"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-primary text-primary-foreground"
      aria-label="Профиль"
    >
      <User size={20} strokeWidth={2} />
    </Link>
  );
}
