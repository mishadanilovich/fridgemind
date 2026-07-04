import type { Metadata, Viewport } from "next";
import "./globals.css";

// Bricolage Grotesque не отдаёт кириллицу через next/font (нет subset'а "cyrillic" в
// текущей версии next/font/google) — подключаем оба шрифта как в макете Claude Design,
// через сам Google Fonts CSS2, который сам отдаёт нужный unicode-range subset.

export const metadata: Metadata = {
  title: "FridgeMind",
  description: "Планирование меню, запасов и списка покупок для семьи",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#F4EEE2",
  width: "device-width",
  initialScale: 1,
};

type Props = LayoutProps<"/">;

export default function RootLayout({ children }: Props) {
  return (
    <html lang="ru">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Hanken+Grotesk:wght@400;500;600;700&display=swap"
      />
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
