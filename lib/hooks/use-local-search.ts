"use client";

import { useMemo, useState } from "react";

// Клиентский фильтр уже загруженного списка (в отличие от useIngredientSearch, который ходит на
// сервер за каталогом). filter должен быть стабильным — объявляй его вне компонента, иначе useMemo
// пересчитывается на каждый рендер.
export function useLocalSearch<T>(items: T[], filter: (items: T[], query: string) => T[]) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => filter(items, query), [items, query, filter]);
  const noResults = query.trim() !== "" && results.length === 0;
  return { query, setQuery, results, noResults };
}
