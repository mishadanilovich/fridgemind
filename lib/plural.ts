// Русское склонение существительного по числу: pluralize(1, "приём", "приёма", "приёмов").
// one — для 1, 21, 31…; few — для 2–4, 22–24…; many — для 0, 5–20, 11–14 и т.д.
export function pluralize(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last > 1 && last < 5) return few;
  if (last === 1) return one;
  return many;
}

/** "3 приёма" — число и склонённое слово вместе. */
export function pluralizeWithCount(n: number, one: string, few: string, many: string): string {
  return `${n} ${pluralize(n, one, few, many)}`;
}
