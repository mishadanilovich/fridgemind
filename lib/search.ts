export function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

// Совпадение поискового запроса хотя бы с одним из полей (регистр не учитывается).
// Пустой запрос совпадает со всем — вызывающий код показывает полный список.
export function matchesQuery(haystack: string[], query: string): boolean {
  const q = normalizeQuery(query);
  if (!q) return true;
  return haystack.some((text) => text.toLowerCase().includes(q));
}
