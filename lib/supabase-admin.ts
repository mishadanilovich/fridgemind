import "server-only";

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Сервис-роль обходит RLS целиком, поэтому наружу отдаём только .storage — узкий срез
// клиента, который физически не позволяет вызвать .from(table) на обычных таблицах даже
// по ошибке (Storage-клиент's .from() работает с bucket'ами, а не с Postgres-таблицами).
// Только на сервере (server-only) и только после своей проверки прав в экшене
// (requireRole + householdId), как сейчас в lib/actions/uploads.ts.
export function createStorageAdminClient() {
  if (!SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY не задан");
  }
  const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client.storage;
}
