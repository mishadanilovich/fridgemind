import { describe, expect, it } from "vitest";

import { orphanedStoragePaths, storagePathFromPublicUrl } from "./recipe-photos";

const publicUrl = (path: string) =>
  `https://abc.supabase.co/storage/v1/object/public/recipe-photos/${path}`;

describe("storagePathFromPublicUrl", () => {
  it("extracts the bucket-relative path", () => {
    expect(storagePathFromPublicUrl(publicUrl("hh-1/photo.webp"))).toBe("hh-1/photo.webp");
  });

  it("returns null for URLs outside the bucket", () => {
    expect(storagePathFromPublicUrl("https://example.com/photo.webp")).toBeNull();
    expect(
      storagePathFromPublicUrl(
        "https://abc.supabase.co/storage/v1/object/public/other-bucket/hh-1/photo.webp",
      ),
    ).toBeNull();
    expect(storagePathFromPublicUrl(publicUrl(""))).toBeNull();
  });
});

describe("orphanedStoragePaths", () => {
  it("returns paths of urls that are no longer referenced", () => {
    expect(
      orphanedStoragePaths(
        [publicUrl("hh-1/old-cover.webp"), publicUrl("hh-1/step.webp")],
        [publicUrl("hh-1/new-cover.webp"), publicUrl("hh-1/step.webp")],
      ),
    ).toEqual(["hh-1/old-cover.webp"]);
  });

  it("keeps nothing when all urls are still referenced", () => {
    const urls = [publicUrl("hh-1/cover.webp"), publicUrl("hh-1/step.webp")];
    expect(orphanedStoragePaths(urls, urls)).toEqual([]);
  });

  it("ignores nulls and foreign urls, dedupes repeated ones", () => {
    expect(
      orphanedStoragePaths(
        [null, "https://example.com/x.webp", publicUrl("hh-1/a.webp"), publicUrl("hh-1/a.webp")],
        [null],
      ),
    ).toEqual(["hh-1/a.webp"]);
  });
});
