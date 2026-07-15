"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { APP_TABS, isTabActive } from "./tabs";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card/90 px-2 pb-6 pt-2 backdrop-blur-md">
      {APP_TABS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-1.5 text-[10px] font-bold tracking-wide",
            isTabActive(href, pathname) ? "text-foreground" : "text-nav-inactive",
          )}
        >
          <Icon size={24} strokeWidth={2} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
