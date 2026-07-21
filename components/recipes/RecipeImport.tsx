"use client";

import { Check, ChevronLeft, Copy, FileText, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type ReactNode, useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { confirmRecipeImport, prepareRecipeImport } from "@/lib/actions/recipe-import";
import { callAction } from "@/lib/form-state";
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from "@/lib/product-categories";
import { buildImportPrompt, type ImportPreview, type ImportResolution } from "@/lib/recipe-import";
import type { ProductCategory, Unit, UnitType } from "@/lib/types";
import { UNIT_TO_TYPE, UNIT_TYPE_LABELS } from "@/lib/units";

type IngredientRef = { id: string; name: string; defaultUnitType: UnitType };

type Props = {
  ingredients: IngredientRef[];
};

type Stage = "choose" | "prompt" | "paste" | "confirm";

const norm = (name: string) => name.trim().toLowerCase();

export function RecipeImport({ ingredients }: Props) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("choose");
  const [wishes, setWishes] = useState("");
  const [prompt, setPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [json, setJson] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [resolutions, setResolutions] = useState<Record<string, ImportResolution>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ingredientNames = useMemo(() => ingredients.map((i) => i.name), [ingredients]);

  function generatePrompt() {
    setPrompt(buildImportPrompt(wishes, ingredientNames));
    setCopied(false);
  }

  async function copyPrompt() {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      setError("Не удалось скопировать — выделите текст вручную.");
    }
  }

  function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setJson(String(reader.result ?? ""));
      setError(null);
    };
    reader.readAsText(file);
  }

  function goPaste() {
    setError(null);
    setStage("paste");
  }

  function parse() {
    setError(null);
    startTransition(async () => {
      const result = await callAction(() => prepareRecipeImport(json));
      if (result.error !== null) {
        setError(result.error);
        return;
      }
      setPreview(result.preview);
      // По умолчанию каждый несовпавший продукт создаётся новым в категории «Другое».
      setResolutions(
        Object.fromEntries(
          result.preview.unmatched.map((u) => [norm(u.name), { mode: "new", category: "OTHER" }]),
        ),
      );
      setStage("confirm");
    });
  }

  function setResolution(key: string, resolution: ImportResolution) {
    setResolutions((prev) => ({ ...prev, [key]: resolution }));
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const result = await callAction(() => confirmRecipeImport({ json, resolutions }));
      if (result.error !== null) {
        setError(result.error);
        return;
      }
      router.push("/recipes");
    });
  }

  return (
    <div className="-mx-5 -mt-4">
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-5 py-4 backdrop-blur">
        <Link
          href="/recipes"
          aria-label="Закрыть импорт"
          className="pressable flex size-9 items-center justify-center rounded-full border border-border bg-card text-foreground"
        >
          <ChevronLeft className="size-5" strokeWidth={2.4} />
        </Link>
        <h1 className="font-heading text-lg font-bold text-foreground">Импорт рецептов</h1>
      </div>

      <div className="px-5 py-5">
        {stage === "choose" && (
          <ChooseStage onPrompt={() => setStage("prompt")} onPaste={goPaste} />
        )}

        {stage === "prompt" && (
          <PromptStage
            wishes={wishes}
            onWishes={setWishes}
            prompt={prompt}
            copied={copied}
            onGenerate={generatePrompt}
            onCopy={copyPrompt}
            onNext={goPaste}
            onBack={() => setStage("choose")}
            error={error}
          />
        )}

        {stage === "paste" && (
          <PasteStage
            json={json}
            onJson={setJson}
            onPickFile={onPickFile}
            onContinue={parse}
            onBack={() => setStage("choose")}
            isPending={isPending}
            error={error}
          />
        )}

        {stage === "confirm" && preview && (
          <ConfirmStage
            preview={preview}
            ingredients={ingredients}
            resolutions={resolutions}
            onResolution={setResolution}
            onConfirm={confirm}
            onBack={() => {
              setError(null);
              setStage("paste");
            }}
            isPending={isPending}
            error={error}
          />
        )}
      </div>
    </div>
  );
}

function ChooseStage({ onPrompt, onPaste }: { onPrompt: () => void; onPaste: () => void }) {
  return (
    <>
      <p className="mb-[18px] text-[13.5px] font-medium leading-[1.45] text-muted-foreground">
        Добавьте сразу несколько рецептов. Сгенерируйте промпт для любого ИИ-чата или вставьте
        готовый JSON.
      </p>
      <BigButton
        icon={Sparkles}
        tone="primary"
        title="Сгенерировать промпт для ИИ"
        subtitle="Опишите, что нужно — мы составим готовый запрос"
        onClick={onPrompt}
      />
      <BigButton
        icon={FileText}
        tone="accent"
        title="У меня уже есть готовый JSON"
        subtitle="Вставьте текст или загрузите файл"
        onClick={onPaste}
      />
    </>
  );
}

type BigButtonProps = {
  icon: typeof Sparkles;
  tone: "primary" | "accent";
  title: string;
  subtitle: string;
  onClick: () => void;
};

function BigButton({ icon: Icon, tone, title, subtitle, onClick }: BigButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pressable mb-3 flex w-full items-center gap-3.5 rounded-card border border-border bg-card p-4 text-left"
    >
      <span
        className={
          tone === "primary"
            ? "flex size-[50px] shrink-0 items-center justify-center rounded-lg bg-success text-primary"
            : "flex size-[50px] shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"
        }
      >
        <Icon className="size-[26px]" />
      </span>
      <span>
        <span className="block font-heading text-[16.5px] font-bold leading-[1.15] text-foreground">
          {title}
        </span>
        <span className="mt-[3px] block text-[12.5px] font-medium text-muted-foreground">
          {subtitle}
        </span>
      </span>
    </button>
  );
}

type PromptStageProps = {
  wishes: string;
  onWishes: (v: string) => void;
  prompt: string | null;
  copied: boolean;
  onGenerate: () => void;
  onCopy: () => void;
  onNext: () => void;
  onBack: () => void;
  error: string | null;
};

function PromptStage({
  wishes,
  onWishes,
  prompt,
  copied,
  onGenerate,
  onCopy,
  onNext,
  onBack,
  error,
}: PromptStageProps) {
  return (
    <>
      <div className="mb-2 text-[13px] font-bold text-foreground">Опишите, какие рецепты нужны</div>
      <Textarea
        value={wishes}
        onChange={(e) => onWishes(e.target.value)}
        placeholder="5 быстрых ужинов для семьи с ребёнком, без грибов, с курицей и рыбой"
        className="min-h-[96px]"
      />
      <Button type="button" size="block" className="mt-3 w-full font-bold" onClick={onGenerate}>
        Сгенерировать промпт
      </Button>

      {prompt && (
        <>
          <div className="mb-2 mt-[22px] flex items-center justify-between">
            <div className="text-[13px] font-bold text-foreground">Ваш промпт</div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={copied ? <Check /> : <Copy />}
              onClick={onCopy}
            >
              {copied ? "Скопировано" : "Скопировать"}
            </Button>
          </div>
          <pre className="max-h-[230px] overflow-y-auto whitespace-pre-wrap rounded-card bg-primary px-4 py-3.5 text-[12.5px] leading-[1.55] text-primary-foreground">
            {prompt}
          </pre>
          <p className="mx-0.5 mt-2.5 text-xs font-medium leading-[1.4] text-muted-foreground">
            Вставьте этот промпт в любой ИИ-чат, скопируйте ответ и вернитесь сюда.
          </p>
          <Button
            type="button"
            variant="accent"
            size="block"
            className="mt-3.5 w-full font-bold"
            onClick={onNext}
          >
            Вставить ответ ИИ →
          </Button>
        </>
      )}

      <FieldError message={error} />
      <Button type="button" variant="ghost" className="mt-2 w-full text-muted-foreground" onClick={onBack}>
        Назад
      </Button>
    </>
  );
}

type PasteStageProps = {
  json: string;
  onJson: (v: string) => void;
  onPickFile: (e: ChangeEvent<HTMLInputElement>) => void;
  onContinue: () => void;
  onBack: () => void;
  isPending: boolean;
  error: string | null;
};

function PasteStage({ json, onJson, onPickFile, onContinue, onBack, isPending, error }: PasteStageProps) {
  return (
    <>
      <div className="mb-2 text-[13px] font-bold text-foreground">Вставьте JSON сюда</div>
      <Textarea
        value={json}
        onChange={(e) => onJson(e.target.value)}
        placeholder='{ "recipes": [ { "title": "…", "baseServings": 4, "ingredients": [ … ], "steps": [ … ] } ] }'
        className="min-h-[180px] font-mono text-[13px]"
      />
      <label className="pressable mt-3 flex cursor-pointer items-center justify-center gap-2.5 rounded-lg border-[1.5px] border-dashed border-nav-inactive py-3 text-[13.5px] font-bold text-primary">
        <Upload className="size-[18px]" />
        или загрузить файл
        <input
          type="file"
          accept=".json,application/json,text/plain"
          onChange={onPickFile}
          className="hidden"
        />
      </label>
      <FieldError message={error} />
      <Button
        type="button"
        size="block"
        className="mt-3.5 w-full font-bold"
        loading={isPending}
        onClick={onContinue}
      >
        Продолжить
      </Button>
      <Button type="button" variant="ghost" className="mt-2 w-full text-muted-foreground" onClick={onBack}>
        Назад
      </Button>
    </>
  );
}

type ConfirmStageProps = {
  preview: ImportPreview;
  ingredients: IngredientRef[];
  resolutions: Record<string, ImportResolution>;
  onResolution: (key: string, resolution: ImportResolution) => void;
  onConfirm: () => void;
  onBack: () => void;
  isPending: boolean;
  error: string | null;
};

function ConfirmStage({
  preview,
  ingredients,
  resolutions,
  onResolution,
  onConfirm,
  onBack,
  isPending,
  error,
}: ConfirmStageProps) {
  return (
    <>
      <p className="mb-3.5 text-[13.5px] font-medium text-muted-foreground">
        Будет добавлено <b className="text-foreground">{preview.recipes.length}</b> — проверьте
        перед импортом.
      </p>

      <div className="space-y-3">
        {preview.recipes.map((recipe, i) => (
          <div key={i} className="rounded-card border border-border bg-card p-3.5">
            <div className="break-words font-heading text-base font-bold leading-[1.15] text-foreground">
              {recipe.title}
            </div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">
              {recipe.ingredientCount} ингр. · {recipe.stepCount} шаг.
              {recipe.cookTimeMinutes ? ` · ~${recipe.cookTimeMinutes} мин` : ""} ·{" "}
              {recipe.baseServings} порц.
            </div>
          </div>
        ))}
      </div>

      {preview.unmatched.length > 0 && (
        <div className="mt-5">
          <div className="mb-1 text-[13px] font-bold text-foreground">Новые продукты</div>
          <p className="mb-3 text-[12px] font-medium leading-[1.4] text-muted-foreground">
            Этих продуктов нет в справочнике — сопоставьте с существующим или создайте новый с
            категорией.
          </p>
          <div className="space-y-2.5">
            {preview.unmatched.map((item) => (
              <UnmatchedRow
                key={norm(item.name)}
                name={item.name}
                unit={item.unit}
                ingredients={ingredients}
                resolution={resolutions[norm(item.name)]}
                onChange={(r) => onResolution(norm(item.name), r)}
              />
            ))}
          </div>
        </div>
      )}

      <FieldError message={error} />

      <div className="mt-4 flex gap-3">
        <Button type="button" variant="outline" size="block" className="flex-1" onClick={onBack}>
          Назад
        </Button>
        <Button
          type="button"
          size="block"
          className="flex-[2] font-bold"
          loading={isPending}
          onClick={onConfirm}
        >
          Импортировать
        </Button>
      </div>
    </>
  );
}

type UnmatchedRowProps = {
  name: string;
  unit: Unit;
  ingredients: IngredientRef[];
  resolution: ImportResolution | undefined;
  onChange: (resolution: ImportResolution) => void;
};

function UnmatchedRow({ name, unit, ingredients, resolution, onChange }: UnmatchedRowProps) {
  const mode = resolution?.mode ?? "new";
  const neededType = UNIT_TO_TYPE[unit];
  // Сопоставлять можно только с продуктом тех же единиц (иначе unit ≠ defaultUnitType, что
  // ломает список покупок и сравнение "есть/нужно"). Показываем только совместимые.
  const compatible = ingredients.filter((ing) => ing.defaultUnitType === neededType);

  return (
    <div className="rounded-card border border-border bg-card p-3">
      <div className="mb-2.5 text-sm font-bold text-foreground">{name}</div>
      <div className="mb-2.5 flex gap-2">
        <ModeButton
          active={mode === "existing"}
          onClick={() => onChange({ mode: "existing", ingredientId: "" })}
        >
          Сопоставить
        </ModeButton>
        <ModeButton
          active={mode === "new"}
          onClick={() => onChange({ mode: "new", category: "OTHER" })}
        >
          Создать новый
        </ModeButton>
      </div>

      {mode === "existing" ? (
        compatible.length === 0 ? (
          <p className="text-xs font-medium text-muted-foreground">
            В справочнике нет продуктов в этих единицах ({UNIT_TYPE_LABELS[neededType]}) — создайте
            новый.
          </p>
        ) : (
          <Select
            value={resolution?.mode === "existing" ? resolution.ingredientId : ""}
            onValueChange={(v) => onChange({ mode: "existing", ingredientId: v })}
          >
            <SelectTrigger aria-label={`Продукт для «${name}»`}>
              <SelectValue placeholder="Выберите продукт из справочника…" />
            </SelectTrigger>
            <SelectContent>
              {compatible.map((ing) => (
                <SelectItem key={ing.id} value={ing.id}>
                  {ing.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      ) : (
        <Select
          value={resolution?.mode === "new" ? resolution.category : "OTHER"}
          onValueChange={(v) => onChange({ mode: "new", category: v as ProductCategory })}
        >
          <SelectTrigger aria-label={`Категория для «${name}»`}>
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
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "flex-1 rounded-md border border-primary bg-primary px-2 py-2 text-xs font-bold text-primary-foreground"
          : "flex-1 rounded-md border border-border bg-card px-2 py-2 text-xs font-bold text-foreground"
      }
    >
      {children}
    </button>
  );
}
