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

export type StorageFileEntry = { path: string; createdAt: string | null };

const DAY_MS = 24 * 60 * 60 * 1000;

// Периодическая чистка (issue #3): файлы bucket'а, не упомянутые ни в одном photoUrl и старше
// суток. Свежие сироты не трогаем — они могли быть только что загружены в ещё не сохранённую
// форму; файлы без createdAt — тоже (консервативно: лучше оставить сироту, чем удалить нужное).
export function staleOrphanPaths(
  files: StorageFileEntry[],
  referencedPaths: ReadonlySet<string>,
  now: Date,
  maxAgeMs: number = DAY_MS,
): string[] {
  return files
    .filter(
      (f) =>
        !referencedPaths.has(f.path) &&
        f.createdAt !== null &&
        now.getTime() - new Date(f.createdAt).getTime() > maxAgeMs,
    )
    .map((f) => f.path);
}
