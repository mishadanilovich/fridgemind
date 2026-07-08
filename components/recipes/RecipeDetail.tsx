"use client";

import { ChevronLeft, CookingPot } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { scaleIngredient } from "@/lib/recipes";
import type { RecipeWithDetails } from "@/lib/types";
import { formatQuantity, UNIT_TO_TYPE } from "@/lib/units";

import { CookingMethodBadges } from "./CookingMethodBadges";
import { ServingsStepper } from "./ServingsStepper";

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
          <Image
            src={recipe.photoUrl}
            alt={recipe.title}
            fill
            priority
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover"
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
          className="pressable absolute left-4 top-4 flex size-10 items-center justify-center rounded-full bg-background/90 backdrop-blur"
        >
          <ChevronLeft className="size-5 text-foreground" strokeWidth={2.4} />
        </Link>
      </div>

      <div className="px-[22px]">
        <Badge variant="accent" className="font-bold uppercase tracking-[0.06em]">
          {meta}
        </Badge>
        <h1 className="mb-3 mt-[5px] font-heading text-[29px] font-bold leading-[1.08] text-foreground">
          {recipe.title}
        </h1>

        <CookingMethodBadges methods={recipe.cookingMethods} variant="pill" className="mb-4" />

        <ServingsStepper
          label="Порции"
          value={servings}
          onChange={setServings}
          className="mb-[22px]"
        />

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
                <Badge key={ri.id} variant="chip" size="lg">
                  <span className="size-1.5 rounded-full bg-primary" />
                  {ri.ingredient.name} · {formatQuantity(amount, ri.unit)}
                </Badge>
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
                <div className="relative h-[180px] w-full">
                  <Image
                    src={step.photoUrl}
                    alt=""
                    fill
                    sizes="(max-width: 448px) 100vw, 448px"
                    className="object-cover"
                  />
                </div>
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
                <Button
                  type="button"
                  variant="outline"
                  disabled={stepIndex === 0}
                  onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                  className="h-auto flex-1 rounded-[15px] bg-card py-3.5 font-bold"
                >
                  Назад
                </Button>
                <Button
                  type="button"
                  variant="accent"
                  disabled={stepIndex >= steps.length - 1}
                  onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
                  className="h-auto flex-1 rounded-[15px] py-3.5 font-bold"
                >
                  Далее
                </Button>
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
