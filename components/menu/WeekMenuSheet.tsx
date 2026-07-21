"use client";

import { AlertTriangle, CalendarDays, FileText, MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  applyMenuTemplate,
  deleteMenuTemplate,
  renameMenuTemplate,
  saveMenuTemplate,
} from "@/lib/actions/menu-templates";
import { formatShortDate } from "@/lib/dates";
import { callAction } from "@/lib/form-state";
import { MENU_TEMPLATE_LIMIT } from "@/lib/menu";
import { pluralizeWithCount } from "@/lib/plural";
import type { MenuTemplateCardView } from "@/lib/types";

type Props = {
  weekStart: string;
  templates: MenuTemplateCardView[];
  /** В текущей неделе уже что-то запланировано — тогда применение шаблона показывает предупреждение. */
  weekHasPlan: boolean;
};

type View = "menu" | "save" | "list" | "rename" | "delete" | "apply" | "limit";

const TITLES: Record<View, string> = {
  menu: "Меню недели",
  save: "Сохранить как шаблон",
  list: "Шаблоны",
  rename: "Переименовать шаблон",
  delete: "Удалить шаблон?",
  apply: "Применить шаблон?",
  limit: "Лимит шаблонов",
};

export function WeekMenuSheet({ weekStart, templates, weekHasPlan }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const [selected, setSelected] = useState<MenuTemplateCardView | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset(next: boolean) {
    setOpen(next);
    if (!next) return;
    setView("menu");
    setSelected(null);
    setName("");
    setError(null);
  }

  function goto(next: View) {
    setError(null);
    setView(next);
  }

  function run(action: () => Promise<{ error: string | null }>, onDone: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await callAction(action);
      if (result.error) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  const atLimit = templates.length >= MENU_TEMPLATE_LIMIT;

  return (
    <>
      <button
        type="button"
        onClick={() => reset(true)}
        aria-label="Действия с меню недели"
        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground pressable"
      >
        <MoreVertical className="size-5" />
      </button>

      <BottomSheet open={open} onOpenChange={reset} title={TITLES[view]}>
        {view === "menu" && (
          <div className="space-y-2.5">
            <SheetAction
              icon={FileText}
              tone="primary"
              title="Сохранить как шаблон"
              subtitle="Запомнить текущее меню недели"
              onClick={() => goto(atLimit ? "limit" : "save")}
            />
            <SheetAction
              icon={CalendarDays}
              tone="accent"
              title="Шаблоны"
              subtitle="Применить, переименовать или удалить"
              onClick={() => goto("list")}
            />
          </div>
        )}

        {view === "save" && (
          <NameForm
            description="Текущее меню недели сохранится как шаблон — его можно применить к любой другой неделе."
            placeholder="Например, «Обычная неделя»"
            value={name}
            onChange={setName}
            error={error}
            isPending={isPending}
            confirmLabel="Сохранить"
            onCancel={() => goto("menu")}
            onConfirm={() =>
              run(
                () => saveMenuTemplate(weekStart, name),
                () => setOpen(false),
              )
            }
          />
        )}

        {view === "limit" && (
          <div>
            <p className="mb-[18px] mt-0.5 text-sm font-medium text-foreground/70">
              Достигнут лимит в {MENU_TEMPLATE_LIMIT} шаблона, удалите один, чтобы сохранить новый.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="block" className="flex-1" onClick={() => goto("menu")}>
                Закрыть
              </Button>
              <Button size="block" className="flex-1 font-bold" onClick={() => goto("list")}>
                К шаблонам
              </Button>
            </div>
          </div>
        )}

        {view === "list" && (
          <TemplateList
            templates={templates}
            onApply={(t) => {
              setSelected(t);
              if (weekHasPlan) {
                goto("apply");
              } else {
                run(
                  () => applyMenuTemplate(t.id, weekStart),
                  () => setOpen(false),
                );
              }
            }}
            onRename={(t) => {
              setSelected(t);
              setName(t.name);
              goto("rename");
            }}
            onDelete={(t) => {
              setSelected(t);
              goto("delete");
            }}
            error={view === "list" ? error : null}
          />
        )}

        {view === "rename" && selected && (
          <NameForm
            description="Задайте новое название — план недели в шаблоне не изменится."
            placeholder="Название шаблона"
            value={name}
            onChange={setName}
            error={error}
            isPending={isPending}
            confirmLabel="Сохранить"
            onCancel={() => goto("list")}
            onConfirm={() =>
              run(
                () => renameMenuTemplate(selected.id, name),
                () => goto("list"),
              )
            }
          />
        )}

        {view === "delete" && selected && (
          <ConfirmBody
            icon={Trash2}
            tone="destructive"
            description={
              <>
                «<b className="text-foreground">{selected.name}</b>» будет удалён без возможности
                восстановить.
              </>
            }
            error={error}
            isPending={isPending}
            confirmLabel="Удалить"
            confirmVariant="destructive"
            onCancel={() => goto("list")}
            onConfirm={() =>
              run(
                () => deleteMenuTemplate(selected.id),
                () => goto("list"),
              )
            }
          />
        )}

        {view === "apply" && selected && (
          <ConfirmBody
            icon={AlertTriangle}
            tone="accent"
            description={
              <>
                «<b className="text-foreground">{selected.name}</b>» заменит уже запланированные
                рецепты на этой неделе. Слоты, которых нет в шаблоне, останутся без изменений.
              </>
            }
            error={error}
            isPending={isPending}
            confirmLabel="Применить"
            confirmVariant="default"
            onCancel={() => goto("list")}
            onConfirm={() =>
              run(
                () => applyMenuTemplate(selected.id, weekStart),
                () => setOpen(false),
              )
            }
          />
        )}
      </BottomSheet>
    </>
  );
}

type ActionProps = {
  icon: typeof FileText;
  tone: "primary" | "accent";
  title: string;
  subtitle: string;
  onClick: () => void;
};

function SheetAction({ icon: Icon, tone, title, subtitle, onClick }: ActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pressable flex w-full items-center gap-[13px] rounded-card border border-border bg-card p-4 text-left"
    >
      <span
        className={
          tone === "primary"
            ? "flex size-[38px] shrink-0 items-center justify-center rounded-sm bg-success text-primary"
            : "flex size-[38px] shrink-0 items-center justify-center rounded-sm bg-accent/10 text-accent"
        }
      >
        <Icon className="size-5" />
      </span>
      <span>
        <span className="block text-[14.5px] font-bold text-foreground">{title}</span>
        <span className="mt-px block text-xs font-medium text-muted-foreground">{subtitle}</span>
      </span>
    </button>
  );
}

type TemplateListProps = {
  templates: MenuTemplateCardView[];
  onApply: (t: MenuTemplateCardView) => void;
  onRename: (t: MenuTemplateCardView) => void;
  onDelete: (t: MenuTemplateCardView) => void;
  error: string | null;
};

function TemplateList({ templates, onApply, onRename, onDelete, error }: TemplateListProps) {
  if (templates.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="mb-1 font-heading text-base font-bold text-foreground">Пока нет шаблонов</p>
        <p className="text-[12.5px] font-medium text-muted-foreground">
          Сохраните текущее меню как шаблон
        </p>
      </div>
    );
  }
  return (
    <div className="-mx-1 max-h-[60vh] space-y-3 overflow-y-auto px-1">
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      {templates.map((t) => (
        <div key={t.id} className="rounded-card border border-border bg-card p-[15px]">
          <div className="flex items-start gap-3">
            <span className="flex size-[42px] shrink-0 items-center justify-center rounded-md bg-success text-primary">
              <CalendarDays className="size-[22px]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="break-words font-heading text-base font-bold leading-[1.15] text-foreground">
                {t.name}
              </div>
              <div className="mt-[3px] text-[11.5px] font-semibold text-muted-foreground">
                {formatShortDate(t.createdAtIso)} ·{" "}
                {pluralizeWithCount(t.mealCount, "приём", "приёма", "приёмов")}
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" className="flex-1 font-bold" onClick={() => onApply(t)}>
              Применить
            </Button>
            <Button
              variant="outline"
              size="iconSm"
              aria-label={`Переименовать «${t.name}»`}
              onClick={() => onRename(t)}
            >
              <Pencil />
            </Button>
            <Button
              variant="destructiveMuted"
              size="iconSm"
              aria-label={`Удалить «${t.name}»`}
              onClick={() => onDelete(t)}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

type NameFormProps = {
  description: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error: string | null;
  isPending: boolean;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

function NameForm({
  description,
  placeholder,
  value,
  onChange,
  error,
  isPending,
  confirmLabel,
  onCancel,
  onConfirm,
}: NameFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onConfirm();
      }}
    >
      <p className="mb-4 mt-0.5 text-[13.5px] font-medium text-muted-foreground">{description}</p>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus
        maxLength={40}
        className="mb-1"
      />
      {error && <p className="mb-2 text-sm font-medium text-destructive">{error}</p>}
      <div className="mt-4 flex gap-3">
        <Button type="button" variant="outline" size="block" className="flex-1" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" size="block" className="flex-1 font-bold" loading={isPending}>
          {confirmLabel}
        </Button>
      </div>
    </form>
  );
}

type ConfirmBodyProps = {
  icon: typeof Trash2;
  tone: "destructive" | "accent";
  description: ReactNode;
  error: string | null;
  isPending: boolean;
  confirmLabel: string;
  confirmVariant: "destructive" | "default";
  onCancel: () => void;
  onConfirm: () => void;
};

function ConfirmBody({
  icon: Icon,
  tone,
  description,
  error,
  isPending,
  confirmLabel,
  confirmVariant,
  onCancel,
  onConfirm,
}: ConfirmBodyProps) {
  return (
    <div>
      <span
        className={
          tone === "destructive"
            ? "mb-3 flex size-[38px] items-center justify-center rounded-sm bg-destructive/10 text-destructive"
            : "mb-3 flex size-[38px] items-center justify-center rounded-sm bg-accent/10 text-accent"
        }
      >
        <Icon className="size-5" />
      </span>
      <p className="mb-[18px] break-words text-sm font-medium text-foreground/70">{description}</p>
      {error && <p className="mb-3 text-sm font-medium text-destructive">{error}</p>}
      <div className="flex gap-3">
        <Button variant="outline" size="block" className="flex-1" onClick={onCancel}>
          Отмена
        </Button>
        <Button
          variant={confirmVariant}
          size="block"
          className="flex-1 font-bold"
          loading={isPending}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
