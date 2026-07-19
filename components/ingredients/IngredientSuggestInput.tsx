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
  // ingredient — точное совпадение с каталогом (подставить единицу/категорию); null — имя ушло
  // с ранее подставленного продукта, родителю нужно откатить подстановку.
  onPick?: (ingredient: Ingredient | null) => void;
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

  // Точное совпадение выпадает из suggestions (фильтр выше), поэтому его единицу/категорию
  // нельзя подставить кликом — подхватываем автоматически, как будто по нему кликнули.
  const exactMatch = results.find((r) => r.name.toLowerCase() === trimmed.toLowerCase()) ?? null;

  // Каталожное совпадение, чьи единицу/категорию мы уже отдали родителю через onPick. Держим,
  // чтобы откатить их (onPick(null)), когда имя перестаёт называть этот продукт: транзитное
  // совпадение (печатали «Лимон» по пути к «Лимонная кислота») иначе оставило бы чужую единицу.
  // Сверяем по имени, а не по наличию в results, чтобы задержка/очистка поиска не дала ни ложного
  // отката (после клика по подсказке results пуст, но имя не менялось), ни повторной подстановки.
  const appliedMatch = useRef<Ingredient | null>(null);
  const userTyped = useRef(false);

  useEffect(() => {
    const q = trimmed.toLowerCase();
    if (appliedMatch.current && appliedMatch.current.name.toLowerCase() === q) return;

    // Один вызов onPick за проход: при переходе сразу от одного совпадения к другому родитель
    // получает только новое значение, а не null+новое — иначе оба вызова читают один и тот же
    // непрокрученный unit/category из замыкания, и базовое (до автоподстановки) значение теряется.
    // Предзаполненное при монтировании имя (userTyped=false, напр. редактирование позиции) не
    // трогаем, чтобы не перезатереть сохранённую единицу.
    if (exactMatch && userTyped.current) {
      appliedMatch.current = exactMatch;
      onPick?.(exactMatch);
    } else if (appliedMatch.current) {
      appliedMatch.current = null;
      onPick?.(null);
    }
  }, [exactMatch, trimmed, onPick]);

  function pick(ingredient: Ingredient) {
    clear();
    userTyped.current = true;
    appliedMatch.current = ingredient;
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
          userTyped.current = true;
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
