// Google Fonts CSS2 без браузерного User-Agent отдаёт ttf (а не woff2, который satori —
// движок next/og — не понимает). `text` подгружает только нужные глифы (кириллица), а не
// весь шрифт.
//
// Возвращает null при любом сбое сети/формата, а не бросает: /opengraph-image статический
// (шрифт грузится на билде — упавший fetch уронил бы next build), а /invite/[code]/opengraph-image
// динамический (каждый разворот ссылки бил бы Google Fonts заново). В обоих случаях лучше
// картинка с дефолтным шрифтом satori, чем 500/упавший билд.
export async function loadOgFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@700&text=${encodeURIComponent(text)}`;
    const css = await fetch(cssUrl).then((res) => res.text());
    const fontUrl = css.match(/src: url\(([^)]+)\) format\('(?:truetype|opentype)'\)/)?.[1];
    if (!fontUrl) return null;

    const fontRes = await fetch(fontUrl);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}
