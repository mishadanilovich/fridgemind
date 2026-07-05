"use client";

import { BookOpen, Calendar, Refrigerator, ShoppingBasket, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Сегодня", icon: Sun },
  { href: "/menu", label: "Меню", icon: Calendar },
  { href: "/recipes", label: "Рецепты", icon: BookOpen },
  { href: "/inventory", label: "Запасы", icon: Refrigerator },
  { href: "/shopping-list", label: "Покупки", icon: ShoppingBasket },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card/90 px-2 pb-6 pt-2 backdrop-blur-md">
      {TABS.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-1.5 text-[10px] font-bold tracking-wide",
              isActive ? "text-foreground" : "text-[hsl(var(--nav-inactive))]",
            )}
          >
            <Icon size={24} strokeWidth={2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
