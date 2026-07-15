import { BookOpen, Calendar, Refrigerator, ShoppingBasket, Sun } from "lucide-react";

/** Пять табов нижней навигации — общий список для BottomNav и офлайн-навигации OfflineApp. */
export const APP_TABS = [
  { href: "/", label: "Сегодня", icon: Sun },
  { href: "/menu", label: "Меню", icon: Calendar },
  { href: "/recipes", label: "Рецепты", icon: BookOpen },
  { href: "/inventory", label: "Запасы", icon: Refrigerator },
  { href: "/shopping-list", label: "Покупки", icon: ShoppingBasket },
] as const;

export function isTabActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
