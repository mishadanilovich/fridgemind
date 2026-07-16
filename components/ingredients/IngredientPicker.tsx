"use client";

import { Check, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createIngredient, searchIngredients } from "@/lib/actions/ingredients";
import { callAction } from "@/lib/form-state";
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from "@/lib/product-categories";
import type { Ingredient, ProductCategory, UnitType } from "@/lib/types";
import { UNIT_TYPE_LABELS } from "@/lib/units";

type Props = {
  value: Pick<Ingredient, "id" | "name"> | null;
  onSelect: (ingredient: Ingredient) => void;
};

const UNIT_TYPES = Object.keys(UNIT_TYPE_LABELS) as UnitType[];

export function IngredientPicker({ value, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Ingredient[]>([]);
  const [creating, setCreating] = useState(false);
  const [isSearching, startSearch] = useTransition();

  // Поля формы создания нового продукта.
  const [newUnitType, setNewUnitType] = useState<UnitType>("WEIGHT");
  const [newCategory, setNewCategory] = useState<ProductCategory>("OTHER");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, startCreate] = useTransition();

  // Дебаунс поиска: 250 мс после последнего нажатия. requestId защищает от гонки — если ответ
  // на более раннюю раскладку придёт позже (сетевой джиттер), он не перезапишет свежие results.
  const latestRequestId = useRef(0);
  useEffect(() => {
    if (!open) return;
    const q = query;
    const t = setTimeout(() => {
      const requestId = ++latestRequestId.current;
      startSearch(async () => {
        try {
          const found = await searchIngredients(q);
          if (requestId === latestRequestId.current) setResults(found);
        } catch {
          // Офлайн/обрыв сети: поиск даёт пустой список, а не роняет экран в error boundary.
          if (requestId === latestRequestId.current) setResults([]);
        }
      });
    }, 250);
    return () => clearTimeout(t);
  }, [query, open]);

  function reset() {
    setQuery("");
    setResults([]);
    setCreating(false);
    setNewUnitType("WEIGHT");
    setNewCategory("OTHER");
    setCreateError(null);
  }

  function choose(ingredient: Ingredient) {
    onSelect(ingredient);
    setOpen(false);
    reset();
  }

  function onCreate() {
    setCreateError(null);
    startCreate(async () => {
      const result = await callAction(() =>
        createIngredient({
          name: query,
          defaultUnitType: newUnitType,
          category: newCategory,
        }),
      );
      if (result.error !== null) {
        setCreateError(result.error);
        return;
      }
      choose(result.ingredient);
    });
  }

  const trimmed = query.trim();
  const exactMatch = results.some((r) => r.name.toLowerCase() === trimmed.toLowerCase());

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="pressable-off w-full justify-start bg-card font-normal"
        >
          {value ? value.name : <span className="text-muted-foreground">Продукт</span>}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Продукт из справочника</DialogTitle>
          <DialogDescription>
            Найдите продукт или создайте новый, если его ещё нет в справочнике.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCreating(false);
            }}
            placeholder="Название продукта"
            maxLength={60}
            className="pl-9"
          />
        </div>

        {!creating && (
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {results.map((ingredient) => (
              <li key={ingredient.id}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => choose(ingredient)}
                  className="w-full justify-between px-3 font-normal hover:bg-muted"
                >
                  <span className="truncate">{ingredient.name}</span>
                  {value?.id === ingredient.id && <Check className="text-primary" />}
                </Button>
              </li>
            ))}
            {!isSearching && results.length === 0 && trimmed !== "" && (
              <li className="px-3 py-2 text-sm text-muted-foreground">Ничего не найдено</li>
            )}
          </ul>
        )}

        {/* Предложение создать новый пункт, когда точного совпадения нет. */}
        {!creating && trimmed !== "" && !exactMatch && (
          <Button type="button" variant="outline" icon={<Plus />} onClick={() => setCreating(true)}>
            Создать «{trimmed}»
          </Button>
        )}

        {creating && (
          <div className="space-y-3 rounded-md border border-border p-3">
            <div className="space-y-1.5">
              <Label>Тип измерения</Label>
              <Select value={newUnitType} onValueChange={(v) => setNewUnitType(v as UnitType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {UNIT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Категория</Label>
              <Select
                value={newCategory}
                onValueChange={(v) => setNewCategory(v as ProductCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {PRODUCT_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {createError && <p className="text-sm text-destructive">{createError}</p>}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                Назад
              </Button>
              <Button type="button" loading={isCreating} onClick={onCreate}>
                Создать и выбрать
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
