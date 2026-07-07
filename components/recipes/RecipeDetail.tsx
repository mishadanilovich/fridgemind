"use client";

import { ChevronLeft, CookingPot, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { scaleIngredient } from "@/lib/recipes";
import type { RecipeWithDetails } from "@/lib/types";
import { formatQuantity, UNIT_TO_TYPE } from "@/lib/units";

import { CookingMethodBadges } from "./CookingMethodBadges";

type Props = {
  recipe: RecipeWithDetails;
};

export function RecipeDetail({ recipe }: Props) {
  const [servings, setServings] = useState(recipe.baseServings);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = recipe.steps;
  const hasSteps = steps.length > 0;
  const step = hasSteps ? steps[Math.min(stepIndex, steps.length - 1)] : null;
  const meta = recipe.cookTimeMinutes ? `~${recipe.cookTimeMinutes} мин` : "Рецепт";

  return (
    <div className="-mx-5 -mt-4 pb-8">
      <div className="relative h-[230px]">
        {recipe.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- next/image + Supabase remotePatterns подключим в этапе 4b
          <img
            src={recipe.photoUrl}
            alt={recipe.title}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-secondary text-muted-foreground">
            <CookingPot className="size-14" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-background" />
        <Link
          href="/recipes"
          aria-label="Назад к рецептам"
          className="absolute left-4 top-4 flex size-10 items-center justify-center rounded-full bg-background/90 backdrop-blur"
        >
          <ChevronLeft className="size-5 text-foreground" strokeWidth={2.4} />
        </Link>
      </div>

      <div className="-mt-1.5 px-[22px]">
        <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-accent">{meta}</div>
        <h1 className="mb-3 mt-[5px] font-heading text-[29px] font-bold leading-[1.08] text-foreground">
          {recipe.title}
        </h1>

        <CookingMethodBadges methods={recipe.cookingMethods} variant="pill" className="mb-4" />

        <div className="mb-[22px] flex items-center justify-between rounded-2xl border border-border bg-card px-[14px] py-[11px]">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground">
              Порции
            </div>
            <div className="font-heading text-lg font-bold text-foreground">{servings} порц.</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Меньше порций"
              disabled={servings <= 1}
              onClick={() => setServings((s) => Math.max(1, s - 1))}
              className="flex size-9 items-center justify-center rounded-[11px] border border-border bg-background text-primary disabled:opacity-40"
            >
              <Minus className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Больше порций"
              disabled={servings >= 99}
              onClick={() => setServings((s) => Math.min(99, s + 1))}
              className="flex size-9 items-center justify-center rounded-[11px] border border-border bg-background text-primary disabled:opacity-40"
            >
              <Plus className="size-5" />
            </button>
          </div>
        </div>

        <div className="mb-2 text-[13px] font-bold text-foreground">Ингредиенты</div>
        {recipe.ingredients.length === 0 ? (
          <p className="mb-6 text-sm text-muted-foreground">Ингредиенты не указаны.</p>
        ) : (
          <div className="mb-6 flex flex-wrap gap-2">
            {recipe.ingredients.map((ri) => {
              const amount = scaleIngredient(
                ri.quantity,
                servings,
                recipe.baseServings,
                UNIT_TO_TYPE[ri.unit],
              );
              return (
                <span
                  key={ri.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-[7px] text-[12.5px] font-semibold text-foreground"
                >
                  <span className="size-1.5 rounded-full bg-primary" />
                  {ri.ingredient.name} · {formatQuantity(amount, ri.unit)}
                </span>
              );
            })}
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <div className="text-[13px] font-bold text-foreground">Приготовление</div>
          {hasSteps && (
            <div className="text-xs font-bold text-muted-foreground">
              Шаг {stepIndex + 1} из {steps.length}
            </div>
          )}
        </div>

        {step ? (
          <>
            <div className="overflow-hidden rounded-[22px] border border-border bg-card">
              {step.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- next/image + Supabase remotePatterns подключим в этапе 4b
                <img src={step.photoUrl} alt="" className="h-[180px] w-full object-cover" />
              )}
              <div className="flex items-start gap-[13px] p-5">
                <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[11px] bg-primary font-heading text-base font-extrabold text-primary-foreground">
                  {stepIndex + 1}
                </span>
                <p className="mt-1 text-[15.5px] font-medium leading-[1.45] text-foreground">
                  {step.instruction}
                </p>
              </div>
            </div>

            {steps.length > 1 && (
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  disabled={stepIndex === 0}
                  onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                  className="flex-1 rounded-[15px] border border-border bg-card py-3.5 text-sm font-bold text-foreground disabled:opacity-40"
                >
                  Назад
                </button>
                <button
                  type="button"
                  disabled={stepIndex >= steps.length - 1}
                  onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
                  className="flex-1 rounded-[15px] bg-accent py-3.5 text-sm font-bold text-accent-foreground disabled:opacity-40"
                >
                  Далее
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Шаги приготовления не добавлены.</p>
        )}
      </div>
    </div>
  );
}
