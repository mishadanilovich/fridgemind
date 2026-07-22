import { ImageResponse } from "next/og";

import { FridgeMark, OG_COLORS, OG_SIZE } from "@/lib/og";
import { loadOgFont } from "@/lib/og-font";
import { prisma } from "@/lib/prisma";

export const size = OG_SIZE;
export const contentType = "image/png";

type Props = { params: Promise<{ code: string }> };

const SUBTITLE = "Общие запасы, меню и список покупок для всей семьи";

export default async function Image({ params }: Props) {
  const { code } = await params;
  const household = await prisma.household.findUnique({
    where: { inviteCode: code },
    select: { name: true },
  });

  const fallbackName = household ? (household.name ?? "Наша кухня") : null;
  const displayName = fallbackName && fallbackName.length > 40 ? `${fallbackName.slice(0, 40)}…` : fallbackName;
  const title = displayName ? `Приглашение в «${displayName}»` : "Приглашение в FridgeMind";

  const fontData = await loadOgFont(`${title}${SUBTITLE}FridgeMind`);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: OG_COLORS.background,
          fontFamily: "Hanken Grotesk",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <FridgeMark size={64} />
          <div style={{ fontSize: 36, fontWeight: 700, color: OG_COLORS.cream }}>FridgeMind</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 980 }}>
          <div style={{ fontSize: 68, fontWeight: 700, color: OG_COLORS.cream, lineHeight: 1.15 }}>
            {title}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: OG_COLORS.accent }}>{SUBTITLE}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData ? [{ name: "Hanken Grotesk", data: fontData, weight: 700, style: "normal" }] : undefined,
    },
  );
}
