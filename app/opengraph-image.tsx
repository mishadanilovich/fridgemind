import { ImageResponse } from "next/og";

import { FridgeMark, OG_COLORS, OG_SIZE } from "@/lib/og";
import { loadOgFont } from "@/lib/og-font";

export const size = OG_SIZE;
export const contentType = "image/png";

const TITLE = "FridgeMind";
const TAGLINE = "Меню, запасы и список покупок — на всю семью";

export default async function Image() {
  const fontData = await loadOgFont(TITLE + TAGLINE);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
          backgroundColor: OG_COLORS.background,
          fontFamily: "Hanken Grotesk",
        }}
      >
        <FridgeMark size={180} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 96, fontWeight: 700, color: OG_COLORS.cream, letterSpacing: "-2px" }}>
            {TITLE}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: OG_COLORS.cream, opacity: 0.75 }}>
            {TAGLINE}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData ? [{ name: "Hanken Grotesk", data: fontData, weight: 700, style: "normal" }] : undefined,
    },
  );
}
