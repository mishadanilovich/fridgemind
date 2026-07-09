export const RECIPE_PHOTOS_BUCKET = "recipe-photos";

const PUBLIC_URL_PREFIX = `/storage/v1/object/public/${RECIPE_PHOTOS_BUCKET}/`;

// publicUrl → путь внутри bucket'а ({householdId}/{uuid}.webp); null для чужих/битых URL —
// такие просто не участвуют в чистке Storage.
export function storagePathFromPublicUrl(url: string): string | null {
  const idx = url.indexOf(PUBLIC_URL_PREFIX);
  if (idx === -1) return null;
  const path = url.slice(idx + PUBLIC_URL_PREFIX.length);
  return path !== "" ? decodeURIComponent(path) : null;
}

// Пути файлов, на которые рецепт ссылался до сохранения и перестал ссылаться после (issue #3).
export function orphanedStoragePaths(
  oldUrls: (string | null)[],
  keptUrls: (string | null)[],
): string[] {
  const kept = new Set(keptUrls);
  const paths = oldUrls
    .filter((url): url is string => url !== null && !kept.has(url))
    .map(storagePathFromPublicUrl)
    .filter((path): path is string => path !== null);
  return [...new Set(paths)];
}
