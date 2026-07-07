"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { saveRecipe } from "@/lib/actions/recipes";
import {
  COOKING_METHOD_ICONS,
  COOKING_METHOD_LABELS,
  COOKING_METHODS,
} from "@/lib/cooking-methods";
import { initialFormState } from "@/lib/form-state";
import type {
  CookingMethod,
  Ingredient,
  RecipeWithDetails,
  Unit,
} from "@/lib/types";
import { DISPLAY_UNIT_LABEL, UNIT_TYPE_TO_UNIT } from "@/lib/units";
import { cn } from "@/lib/utils";

import { IngredientPicker } from "./IngredientPicker";
import { ServingsStepper } from "./ServingsStepper";

type IngredientRow = {
  key: string;
  product: { id: string; name: string; unit: Unit } | null;
  qty: string;
};
type StepRow = { key: string; instruction: string };

type Props = {
  recipe?: RecipeWithDetails;
};

const uid = () => crypto.randomUUID();

function unitForIngredient(ingredient: Ingredient): Unit {
  return UNIT_TYPE_TO_UNIT[ingredient.defaultUnitType];
}

export function RecipeForm({ recipe }: Props) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    saveRecipe,
    initialFormState,
  );

  const [title, setTitle] = useState(recipe?.title ?? "");
  const [baseServings, setBaseServings] = useState(recipe?.baseServings ?? 2);
  const [cookTime, setCookTime] = useState(
    recipe?.cookTimeMinutes != null ? String(recipe.cookTimeMinutes) : "",
  );
  const [methods, setMethods] = useState<CookingMethod[]>(
    recipe?.cookingMethods ?? [],
  );
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    recipe?.ingredients.map((ri) => ({
      key: uid(),
      product: { id: ri.ingredientId, name: ri.ingredient.name, unit: ri.unit },
      qty: String(ri.quantity),
    })) ?? [{ key: uid(), product: null, qty: "" }],
  );
  const [steps, setSteps] = useState<StepRow[]>(
    recipe?.steps.map((s) => ({ key: uid(), instruction: s.instruction })) ?? [
      { key: uid(), instruction: "" },
    ],
  );

  function toggleMethod(method: CookingMethod) {
    setMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method],
    );
  }

  const payload = JSON.stringify({
    title: title.trim(),
    baseServings,
    cookTimeMinutes: cookTime.trim() === "" ? null : Number(cookTime),
    cookingMethods: methods,
    ingredients: ingredients
      .filter((r) => r.product && Number(r.qty) > 0)
      .map((r) => ({
        ingredientId: r.product!.id,
        quantity: Number(r.qty),
        unit: r.product!.unit,
      })),
    steps: steps
      .map((s) => s.instruction.trim())
      .filter(Boolean)
      .map((instruction, order) => ({ order, instruction })),
  });

  return (
    <form action={formAction} className="-mx-5 -mt-4">
      <input type="hidden" name="recipeId" value={recipe?.id ?? ""} />
      <input type="hidden" name="payload" value={payload} />

      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-5 py-4 backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="px-2 font-semibold text-muted-foreground"
        >
          Отмена
        </Button>
        <div className="font-heading text-base font-bold text-foreground">
          {recipe ? "Изменить рецепт" : "Новый рецепт"}
        </div>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={isPending}
          className="px-2 font-extrabold text-accent"
        >
          Сохранить
        </Button>
      </div>

      <div className="space-y-6 px-5 pb-11 pt-5">
        <div>
          <FieldLabel>Название</FieldLabel>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например, Тыквенный крем-суп"
            maxLength={80}
            className="w-full rounded-[15px] border border-border bg-card px-4 py-3.5 text-[15px] font-semibold text-foreground outline-none"
          />
        </div>

        <div>
          <FieldLabel>Базовое количество порций</FieldLabel>
          <ServingsStepper
            label="Порции"
            value={baseServings}
            onChange={setBaseServings}
          />
        </div>

        <div>
          <FieldLabel>Время приготовления, мин</FieldLabel>
          <input
            value={cookTime}
            onChange={(e) => setCookTime(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder="Необязательно"
            maxLength={4}
            className="w-full rounded-[15px] border border-border bg-card px-4 py-3.5 text-[15px] font-semibold text-foreground outline-none"
          />
        </div>

        <div>
          <FieldLabel>Способ приготовления</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {COOKING_METHODS.map((method) => {
              const Icon = COOKING_METHOD_ICONS[method];
              const on = methods.includes(method);
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => toggleMethod(method)}
                  aria-pressed={on}
                  className={cn(
                    "pressable inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold",
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                  {COOKING_METHOD_LABELS[method]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <FieldLabel>Ингредиенты</FieldLabel>
          <div className="space-y-2.5">
            {ingredients.map((row) => (
              <div key={row.key} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <IngredientPicker
                    value={row.product}
                    onSelect={(ing) =>
                      setIngredients((prev) =>
                        prev.map((r) =>
                          r.key === row.key
                            ? {
                                ...r,
                                product: {
                                  id: ing.id,
                                  name: ing.name,
                                  unit: unitForIngredient(ing),
                                },
                                qty: "",
                              }
                            : r,
                        ),
                      )
                    }
                  />
                </div>
                <input
                  value={row.qty}
                  onChange={(e) => {
                    const qty = e.target.value.replace(/[^\d.]/g, "");
                    setIngredients((prev) =>
                      prev.map((r) => (r.key === row.key ? { ...r, qty } : r)),
                    );
                  }}
                  inputMode="decimal"
                  placeholder="100"
                  className="w-[62px] shrink-0 rounded-[13px] border border-border bg-card px-2 py-3 text-center text-sm font-semibold text-foreground outline-none"
                />
                <span className="w-[38px] shrink-0 text-center text-sm font-semibold text-muted-foreground">
                  {row.product ? DISPLAY_UNIT_LABEL[row.product.unit] : "—"}
                </span>
                {ingredients.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setIngredients((prev) => prev.filter((r) => r.key !== row.key))
                    }
                    aria-label="Убрать ингредиент"
                    className="size-8 shrink-0 text-muted-foreground"
                  >
                    <X />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setIngredients((prev) => [...prev, { key: uid(), product: null, qty: "" }])
            }
            className="mt-2.5 h-auto w-full rounded-[13px] border-[1.5px] border-dashed border-[hsl(var(--nav-inactive))] py-2.5 text-[13px] font-bold text-primary"
          >
            + Ещё ингредиент
          </Button>
        </div>

        <div>
          <FieldLabel>Шаги приготовления</FieldLabel>
          <div className="space-y-2.5">
            {steps.map((step, index) => (
              <div
                key={step.key}
                className="rounded-[16px] border border-border bg-card p-[13px]"
              >
                <div className="mb-2.5 flex items-center gap-2.5">
                  <span className="flex size-[26px] items-center justify-center rounded-[8px] bg-primary font-heading text-[13px] font-extrabold text-primary-foreground">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    Шаг {index + 1}
                  </span>
                  {steps.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSteps((prev) => prev.filter((s) => s.key !== step.key))}
                      aria-label="Убрать шаг"
                      className="ml-auto size-7 text-muted-foreground"
                    >
                      <X />
                    </Button>
                  )}
                </div>
                <textarea
                  value={step.instruction}
                  onChange={(e) =>
                    setSteps((prev) =>
                      prev.map((s) =>
                        s.key === step.key
                          ? { ...s, instruction: e.target.value }
                          : s,
                      ),
                    )
                  }
                  rows={2}
                  placeholder="Опишите этот шаг…"
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground outline-none"
                />
              </div>
            ))}
          </div>
          <Button
            type="button"
            onClick={() => setSteps((prev) => [...prev, { key: uid(), instruction: "" }])}
            className="mt-2.5 h-auto w-full rounded-[14px] py-3 font-bold"
          >
            + Добавить шаг
          </Button>
        </div>

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
      </div>
    </form>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <div className="mb-2 text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground">
      {children}
    </div>
  );
}
