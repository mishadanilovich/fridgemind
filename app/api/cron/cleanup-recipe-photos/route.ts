import { NextResponse } from "next/server";

import { cleanupOrphanedRecipePhotos } from "@/lib/recipe-photos-cleanup";

// Vercel Cron (см. vercel.json) дёргает этот роут раз в сутки; заголовок
// Authorization: Bearer ${CRON_SECRET} Vercel подставляет в запрос сам.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const removed = await cleanupOrphanedRecipePhotos();
  return NextResponse.json({ removed });
}
