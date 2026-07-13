"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Клиент для браузера — сейчас только Realtime-подписки (список покупок); auth-сессия
 * читается из тех же cookies, что и у серверного клиента (@supabase/ssr). Синглтон,
 * чтобы повторные монтирования компонентов не плодили вебсокет-соединения.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  client ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return client;
}
