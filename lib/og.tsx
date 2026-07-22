export const OG_SIZE = { width: 1200, height: 630 };

export const OG_COLORS = {
  background: "#35543F",
  cream: "#F4EEE2",
  accent: "#E7743B",
} as const;

export function FridgeMark({ size = 160 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" fill="none">
      <rect x="52" y="30" width="56" height="100" rx="12" fill={OG_COLORS.cream} />
      <line x1="52" y1="62" x2="108" y2="62" stroke={OG_COLORS.background} strokeWidth="3.5" />
      <rect x="60" y="40" width="4.5" height="14" rx="2.2" fill={OG_COLORS.background} />
      <rect x="60" y="70" width="4.5" height="14" rx="2.2" fill={OG_COLORS.background} />
      <circle cx="80" cy="100" r="5" fill={OG_COLORS.accent} />
      <circle cx="94" cy="112" r="5" fill={OG_COLORS.accent} />
      <circle cx="94" cy="90" r="5" fill={OG_COLORS.accent} />
      <line x1="80" y1="100" x2="94" y2="112" stroke={OG_COLORS.accent} strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="100" x2="94" y2="90" stroke={OG_COLORS.accent} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
