import "server-only";

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Сервис-роль клиент — обходит RLS, поэтому ТОЛЬКО на сервере (server-only) и только после
// собственной проверки прав в экшене (requireRole + householdId). Используется для записи в
// Storage: авторизация делается в экшене, дублирующие storage-политики по пути файла не нужны.
export function createSupabaseAdminClient() {
  if (!SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY не задан");
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
