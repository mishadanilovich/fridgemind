"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { searchIngredients } from "@/lib/actions/ingredients";
import type { Ingredient } from "@/lib/types";

// Дебаунс 250 мс + requestId против гонки: поздний ответ на устаревшую раскладку не перезаписывает
// свежие results. clear() инвалидирует висящий запрос (выбор подсказки, закрытие пикера). enabled
// false очищает список и тоже гасит in-flight — пустой запрос при enabled ищет каталог целиком.
export function useIngredientSearch(query: string, enabled: boolean) {
  const [results, setResults] = useState<Ingredient[]>([]);
  const [isSearching, startSearch] = useTransition();
  const latestRequestId = useRef(0);

  useEffect(() => {
    if (!enabled) {
      latestRequestId.current++;
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      const requestId = ++latestRequestId.current;
      startSearch(async () => {
        try {
          const found = await searchIngredients(query);
          if (requestId === latestRequestId.current) setResults(found);
        } catch {
          if (requestId === latestRequestId.current) setResults([]);
        }
      });
    }, 250);
    return () => clearTimeout(t);
  }, [query, enabled]);

  function clear() {
    latestRequestId.current++;
    setResults([]);
  }

  return { results, isSearching, clear };
}
