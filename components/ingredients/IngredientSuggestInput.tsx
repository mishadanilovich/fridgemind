"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { searchIngredients } from "@/lib/actions/ingredients";
import type { Ingredient } from "@/lib/types";

type Props = {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onPick?: (ingredient: Ingredient) => void;
  placeholder?: string;
  error?: string;
};

/**
 * Поле названия с подсказками из справочника: при вводе показывает совпадающие продукты, тап по
 * подсказке подставляет каноничное имя (и через onPick — единицу/категорию). Своё название вписать
 * по-прежнему можно — позиция остаётся свободной, справочник не навязывается.
 */
export function IngredientSuggestInput({
  id,
  name,
  value,
  onChange,
  onPick,
  placeholder,
  error,
}: Props) {
  const [results, setResults] = useState<Ingredient[]>([]);
  const [open, setOpen] = useState(false);
  const [, startSearch] = useTransition();

  // Гонка запросов (как в IngredientPicker): поздний ответ на старую раскладку не перезаписывает
  // свежий. justPicked гасит поиск сразу после выбора — иначе всплыл бы список с одним точным
  // совпадением, которое мы тут же отфильтровываем.
  const latestRequestId = useRef(0);
  const justPicked = useRef(false);

  useEffect(() => {
    if (justPicked.current) {
      justPicked.current = false;
      return;
    }
    const q = value.trim();
    if (q === "") {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      const requestId = ++latestRequestId.current;
      startSearch(async () => {
        try {
          const found = await searchIngredients(q);
          if (requestId === latestRequestId.current) setResults(found);
        } catch {
          if (requestId === latestRequestId.current) setResults([]);
        }
      });
    }, 250);
    return () => clearTimeout(t);
  }, [value]);

  const trimmed = value.trim().toLowerCase();
  const suggestions = results.filter((r) => r.name.toLowerCase() !== trimmed);
  const showList = open && suggestions.length > 0;

  function pick(ingredient: Ingredient) {
    justPicked.current = true;
    onChange(ingredient.name);
    onPick?.(ingredient);
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        maxLength={60}
        autoComplete="off"
        error={error}
      />
      {showList && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-44 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {suggestions.map((ingredient) => (
            <li key={ingredient.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(ingredient)}
                className="w-full truncate px-3 py-2 text-left text-base hover:bg-muted"
              >
                {ingredient.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
