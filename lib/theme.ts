export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "fridgemind-theme";

export const THEME_COLOR = { light: "#F4EEE2", dark: "#211C15" } as const;

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

export function resolveTheme(theme: Theme, systemPrefersDark: boolean): "light" | "dark" {
  if (theme === "system") return systemPrefersDark ? "dark" : "light";
  return theme;
}

// localStorage может бросать (Safari Private Browsing, sandboxed webview, заблокированные cookies).
// ThemeProvider оборачивает весь layout, а global-error.tsx нет — без try/catch такое исключение
// уронило бы всё приложение в белый экран. Тема тогда просто не запоминается.
export function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Недоступный localStorage — тема не переживёт перезагрузку, но это не повод падать.
  }
}

// Блокирующий скрипт в <head>: до первой отрисовки ставит класс .dark и цвет статус-бара PWA под
// реально выбранную тему, иначе мигала бы светлая. Свой try/catch — localStorage может быть
// недоступен. Тема — личная настройка устройства (localStorage), не данные household.
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t==='dark'||((t===null||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement('meta');m.setAttribute('name','theme-color');document.head.appendChild(m);}m.setAttribute('content',d?'${THEME_COLOR.dark}':'${THEME_COLOR.light}');}catch(e){}})();`;
