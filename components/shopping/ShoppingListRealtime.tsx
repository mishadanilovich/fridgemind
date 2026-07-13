"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Props = {
  householdId: string;
};

/**
 * Realtime-синхронизация списка покупок (см. CLAUDE.md §6): подписка на postgres_changes
 * по shopping_list_items своего household; любое чужое изменение → router.refresh(), сервер
 * отдаёт свежие данные, а фильтр по дням и открытые шиты (клиентский стейт) переживают
 * обновление. События фильтруются по household_id и дополнительно закрыты RLS-политикой
 * (select по household), поэтому перед подпиской токен сессии явно передаётся в Realtime —
 * иначе канал успевает подключиться с anon-ключом, и RLS молча отсекает все события.
 *
 * DELETE слушается без фильтра: без replica identity full (которую включать нельзя — RLS
 * не фильтрует DELETE-события, и полные строки протекали бы между household) payload пуст,
 * даже без id — сопоставить событие со своим списком нечем, фильтр по household_id не
 * срабатывает. Поэтому на любой DELETE по таблице просто делаем refresh: наружу ничего не
 * утекает (payload пустой), а лишние обновления от чужих household редки и дёшевы.
 */
export function ShoppingListRealtime({ householdId }: Props) {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    let cancelled = false;
    let channel: RealtimeChannel | null = null;
    // События часто приходят пачками (syncWeekItems переписывает несколько строк разом) —
    // сливаем их в один refresh коротким debounce'ом.
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 250);
    };

    void (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (cancelled || !token) return;
      await supabase.realtime.setAuth(token);

      channel = supabase
        .channel(`shopping-list:${householdId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "shopping_list_items",
            filter: `household_id=eq.${householdId}`,
          },
          refresh,
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "shopping_list_items",
            filter: `household_id=eq.${householdId}`,
          },
          refresh,
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "shopping_list_items" },
          refresh,
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (timer !== null) clearTimeout(timer);
      if (channel !== null) void supabase.removeChannel(channel);
    };
  }, [householdId, router]);

  return null;
}
