import { prisma } from "@/lib/prisma";
import {
  RECIPE_PHOTOS_BUCKET,
  staleOrphanPaths,
  type StorageFileEntry,
  storagePathFromPublicUrl,
} from "@/lib/recipe-photos";
import { createStorageAdminClient } from "@/lib/supabase-admin";

const PAGE_SIZE = 1000;
const REMOVE_CHUNK = 100;

type Bucket = ReturnType<ReturnType<typeof createStorageAdminClient>["from"]>;

async function listPage(bucket: Bucket, prefix: string, offset: number) {
  const { data, error } = await bucket.list(prefix, {
    limit: PAGE_SIZE,
    offset,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) throw new Error(`Storage list failed for "${prefix}": ${error.message}`);
  return data ?? [];
}

// list() иерархический: в корне bucket'а — папки-household (у папок id === null), файлы — внутри.
async function listAllFiles(bucket: Bucket): Promise<StorageFileEntry[]> {
  const files: StorageFileEntry[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const entries = await listPage(bucket, "", offset);
    for (const folder of entries) {
      if (folder.id !== null) continue;
      for (let fileOffset = 0; ; fileOffset += PAGE_SIZE) {
        const fileEntries = await listPage(bucket, folder.name, fileOffset);
        for (const file of fileEntries) {
          if (file.id === null) continue;
          files.push({ path: `${folder.name}/${file.name}`, createdAt: file.created_at ?? null });
        }
        if (fileEntries.length < PAGE_SIZE) break;
      }
    }
    if (entries.length < PAGE_SIZE) break;
  }
  return files;
}

async function referencedPaths(): Promise<Set<string>> {
  // Включая soft-deleted рецепты: их фото нужны истории меню (issue #5), удалять нельзя.
  const [recipes, steps] = await Promise.all([
    prisma.recipe.findMany({ select: { photoUrl: true } }),
    prisma.recipeStep.findMany({ select: { photoUrl: true } }),
  ]);
  const paths = [...recipes, ...steps]
    .map((row) => row.photoUrl)
    .filter((url): url is string => url !== null)
    .map(storagePathFromPublicUrl)
    .filter((path): path is string => path !== null);
  return new Set(paths);
}

export async function cleanupOrphanedRecipePhotos(now = new Date()): Promise<number> {
  const bucket = createStorageAdminClient().from(RECIPE_PHOTOS_BUCKET);
  const files = await listAllFiles(bucket);
  if (files.length === 0) return 0;

  const stale = staleOrphanPaths(files, await referencedPaths(), now);
  for (let i = 0; i < stale.length; i += REMOVE_CHUNK) {
    const chunk = stale.slice(i, i + REMOVE_CHUNK);
    const { error } = await bucket.remove(chunk);
    if (error) throw new Error(`Storage remove failed: ${error.message}`);
  }
  return stale.length;
}
