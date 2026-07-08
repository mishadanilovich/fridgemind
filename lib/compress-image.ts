import imageCompression from "browser-image-compression";

// Единая клиентская утилита сжатия для всех загружаемых изображений (фото рецепта/шагов, а в
// этапе 5 — фото холодильника), чтобы не раздувать Supabase Storage. Возвращает WebP-файл.
export async function compressImage(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 0.6,
    maxWidthOrHeight: 1400,
    useWebWorker: true,
    fileType: "image/webp",
  });
}
