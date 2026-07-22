// Google Fonts CSS2 без браузерного User-Agent отдаёт ttf (а не woff2, который satori —
// движок next/og — не понимает). `text` подгружает только нужные глифы (кириллица), а не
// весь шрифт.
export async function loadOgFont(text: string): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@700&text=${encodeURIComponent(text)}`;
  const css = await fetch(cssUrl).then((res) => res.text());
  const fontUrl = css.match(/src: url\(([^)]+)\) format\('(?:truetype|opentype)'\)/)?.[1];
  if (!fontUrl) throw new Error("Не удалось получить URL шрифта для OG-изображения");

  const fontRes = await fetch(fontUrl);
  return fontRes.arrayBuffer();
}
