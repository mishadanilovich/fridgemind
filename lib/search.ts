export function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

// Пустой запрос совпадает со всем — вызывающий код показывает полный список.
export function matchesQuery(haystack: string[], query: string): boolean {
  const q = normalizeQuery(query);
  if (!q) return true;
  return haystack.some((text) => normalizeQuery(text).includes(q));
}
