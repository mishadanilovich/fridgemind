"use client";

import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { useIngredientSearch } from "@/lib/hooks/use-ingredient-search";
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

export function IngredientSuggestInput({
  id,
  name,
  value,
  onChange,
  onPick,
  placeholder,
  error,
}: Props) {
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trimmed = value.trim();
  const { results, clear } = useIngredientSearch(trimmed, trimmed !== "");

  useEffect(() => {
    return () => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
    };
  }, []);

  const suggestions = results.filter((r) => r.name.toLowerCase() !== trimmed.toLowerCase());
  const showList = open && suggestions.length > 0;

  function pick(ingredient: Ingredient) {
    clear();
    onChange(ingredient.name);
    onPick?.(ingredient);
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
        onFocus={() => {
          if (blurTimer.current) clearTimeout(blurTimer.current);
          setOpen(true);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
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
