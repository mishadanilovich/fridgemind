export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "fridgemind-theme";

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

export function resolveTheme(theme: Theme, systemPrefersDark: boolean): "light" | "dark" {
  if (theme === "system") return systemPrefersDark ? "dark" : "light";
  return theme;
}

// Блокирующий скрипт в <head>: ставит класс .dark до первой отрисовки, иначе мигала бы светлая
// тема на тёмной. Тема — личная настройка устройства (localStorage), не данные household.
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='dark'||((t===null||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;
