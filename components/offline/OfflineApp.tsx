"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  BookOpen,
  ChevronLeft,
  CloudOff,
  LogIn,
  RefreshCw,
  Refrigerator,
  ShoppingBasket,
} from "lucide-react";
import { useEffect, useState } from "react";

import { CategoryDot } from "@/components/inventory/CategoryDot";
import { WeekdayBadge } from "@/components/menu/WeekdayBadge";
import { APP_TABS, isTabActive } from "@/components/nav/tabs";
import { RecipePhoto } from "@/components/recipes/RecipePhoto";
import { BoughtCheckbox } from "@/components/shopping/BoughtCheckbox";
import { CategorySection } from "@/components/ui/category-section";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDayTitle, startOfWeekIso, todayIso, weekdayName } from "@/lib/dates";
import { useOnline } from "@/lib/hooks/use-online";
import { offlineDb } from "@/lib/offline-db";
import { buildShoppingGroups } from "@/lib/shopping-list";
import type { MenuDayView } from "@/lib/types";
import { formatQuantity } from "@/lib/units";
import { cn } from "@/lib/utils";

import { OfflineBanner } from "./OfflineBanner";

type Screen =
  | { kind: "today" }
  | { kind: "menu" }
  | { kind: "day"; date: string }
  | { kind: "recipes" }
  | { kind: "recipe"; id: string }
  | { kind: "inventory" }
  | { kind: "shopping" }
  | { kind: "other" };

// Service worker отдаёт /~offline на любую неудавшуюся навигацию, поэтому реальный адрес
// остаётся в строке браузера — по нему и выбирается, какой кэшированный экран показать.
// ?from= — для прямого открытия /~offline (e2e-тест и ручная проверка).
function matchScreen(path: string): Screen {
  if (path === "/") return { kind: "today" };
  if (path === "/menu") return { kind: "menu" };
  const dayDate = /^\/menu\/(\d{4}-\d{2}-\d{2})$/.exec(path)?.[1];
  if (dayDate) return { kind: "day", date: dayDate };
  if (path === "/recipes") return { kind: "recipes" };
  const recipeId = /^\/recipes\/([^/]+)$/.exec(path)?.[1];
  if (recipeId && recipeId !== "new") return { kind: "recipe", id: recipeId };
  if (path === "/inventory") return { kind: "inventory" };
  if (path === "/shopping-list") return { kind: "shopping" };
  return { kind: "other" };
}

// /~offline — публичный маршрут (SW должен precache'ить его без сессии), поэтому перед
// показом снапшотов проверяется наличие auth-cookie Supabase: на общем устройстве человек
// без входа не увидит чужие данные. Именно присутствие cookie, а не getSession(): офлайн
// истёкший access token не обновить, и getSession() отказал бы легитимному пользователю;
// выход из аккаунта удаляет cookie и заодно чистит весь офлайн-кэш (clearOfflineCache).
function hasAuthCookie(): boolean {
  return document.cookie.split("; ").some((cookie) => {
    const name = cookie.split("=")[0] ?? "";
    return name.startsWith("sb-") && name.includes("-auth-token") && !name.endsWith("-code-verifier");
  });
}

export function OfflineApp() {
  const [screen, setScreen] = useState<Screen | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [path, setPath] = useState("/");
  const online = useOnline();

  useEffect(() => {
    const { pathname, search } = window.location;
    const from = new URLSearchParams(search).get("from");
    const effectivePath = pathname === "/~offline" ? (from ?? "/") : pathname;
    setScreen(matchScreen(effectivePath));
    setPath(effectivePath);
    setSignedIn(hasAuthCookie());
  }, []);

  return (
    <div className="pb-24">
      <OfflineBanner />
      <main className="mx-auto min-h-screen max-w-md px-5 pt-4">
        {online && (
          <a
            href={path}
            className="pressable mb-3 flex items-center justify-center gap-2 rounded-card border border-border bg-card px-4 py-3 text-[13px] font-bold text-primary"
          >
            <RefreshCw className="size-4" strokeWidth={2.4} />
            Сеть снова есть — обновить экран
          </a>
        )}

        {screen === null || signedIn === null ? (
          <LoadingRows />
        ) : signedIn ? (
          <ScreenView screen={screen} />
        ) : (
          <SignInPrompt />
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card/90 px-2 pb-6 pt-2 backdrop-blur-md">
        {APP_TABS.map(({ href, label, icon: Icon }) => (
          // Обычный <a>, не next/link: офлайн каждая навигация должна быть полной загрузкой
          // документа, чтобы её перехватил service worker (client-side переход упал бы на
          // недоступном RSC-запросе).
          <a
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-1.5 text-[10px] font-bold tracking-wide",
              screen !== null && isTabActive(href, path) ? "text-foreground" : "text-nav-inactive",
            )}
          >
            <Icon size={24} strokeWidth={2} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

function ScreenView({ screen }: { screen: Screen }) {
  switch (screen.kind) {
    case "today":
      return <OfflineDayScreen date={todayIso()} title="Сегодня" />;
    case "day":
      return <OfflineDayScreen date={screen.date} title={weekdayName(screen.date)} />;
    case "menu":
      return <OfflineMenuScreen />;
    case "recipes":
      return <OfflineRecipesScreen />;
    case "recipe":
      return <OfflineRecipeScreen id={screen.id} />;
    case "inventory":
      return <OfflineInventoryScreen />;
    case "shopping":
      return <OfflineShoppingScreen />;
    case "other":
      return (
        <>
          <OfflineHeader title="Офлайн" />
          <EmptyState
            icon={CloudOff}
            title="Эта страница недоступна офлайн"
            description="Без сети открываются сохранённые копии экранов: Сегодня, Меню, Рецепты, Запасы и Список покупок."
          />
        </>
      );
  }
}

type HeaderProps = {
  title: string;
  eyebrow?: string;
  cachedAt?: number;
};

const CACHED_AT_FORMAT = new Intl.DateTimeFormat("ru", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

function OfflineHeader({ title, eyebrow = "Офлайн-режим", cachedAt }: HeaderProps) {
  return (
    <div className="mb-4">
      <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-accent">
        {eyebrow}
      </div>
      <h1 className="mt-1 font-heading text-[34px] font-bold leading-[1.05] text-foreground">
        {title}
      </h1>
      {cachedAt !== undefined && (
        <p className="mt-1 text-[12px] font-semibold text-muted-foreground">
          Сохранено {CACHED_AT_FORMAT.format(cachedAt)}
        </p>
      )}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3 pt-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-[88px] w-full rounded-card" />
      <Skeleton className="h-[88px] w-full rounded-card" />
      <Skeleton className="h-[88px] w-full rounded-card" />
    </div>
  );
}

function SignInPrompt() {
  return (
    <>
      <OfflineHeader title="Офлайн" />
      <EmptyState
        icon={LogIn}
        title="Войдите в аккаунт"
        description="Сохранённые офлайн-данные показываются только после входа."
      />
      <a
        href="/login"
        className="pressable mt-4 flex items-center justify-center gap-2 rounded-card bg-primary px-4 py-[14px] text-sm font-bold text-primary-foreground"
      >
        Войти
      </a>
    </>
  );
}

function NoSnapshot({ title }: { title: string }) {
  return (
    <EmptyState
      icon={CloudOff}
      title="Нет сохранённой копии"
      description={`Откройте экран «${title}» при подключении к сети — он сохранится и будет доступен офлайн.`}
    />
  );
}

// --- Сегодня / просмотр дня ---

type DaySnapshot = { day: MenuDayView; cachedAt: number } | null;

function useDaySnapshot(date: string): DaySnapshot | undefined {
  return useLiveQuery(async (): Promise<DaySnapshot> => {
    const cachedDay = await offlineDb.menuDays.get(date);
    if (cachedDay) return { day: cachedDay.data, cachedAt: cachedDay.cachedAt };

    const week = await offlineDb.menuWeeks.get(startOfWeekIso(date));
    const found = week?.data.find((d) => d.date === date);
    return week && found ? { day: found, cachedAt: week.cachedAt } : null;
  }, [date]);
}

function OfflineDayScreen({ date, title }: { date: string; title: string }) {
  const snapshot = useDaySnapshot(date);
  if (snapshot === undefined) return <LoadingRows />;
  if (snapshot === null) {
    return (
      <>
        <OfflineHeader title={title} eyebrow={formatDayTitle(date)} />
        <NoSnapshot title="Сегодня" />
      </>
    );
  }

  const meals = snapshot.day.slots.filter((slot) => slot.meal !== null);
  return (
    <>
      <OfflineHeader title={title} eyebrow={formatDayTitle(date)} cachedAt={snapshot.cachedAt} />
      {meals.length === 0 ? (
        <p className="px-0.5 text-sm font-medium text-muted-foreground">
          На этот день ничего не запланировано.
        </p>
      ) : (
        meals.map((slot) => (
          <div
            key={slot.slotId}
            className="mb-3 flex items-center gap-3 overflow-hidden rounded-card border border-border bg-card p-3"
          >
            <RecipePhoto
              photoUrl={slot.meal?.photoUrl ?? null}
              width={64}
              height={64}
              className="size-16 rounded-lg"
            />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.04em] text-muted-foreground">
                {slot.slotName}
              </div>
              <div className="truncate text-[15px] font-bold text-foreground">
                {slot.meal?.title}
              </div>
              <div className="text-[12px] font-semibold text-muted-foreground">
                {slot.meal?.servings} порц.
                {slot.meal?.isEaten && " · съедено"}
              </div>
            </div>
          </div>
        ))
      )}
    </>
  );
}

// --- Меню на неделю ---

function OfflineMenuScreen() {
  const weekStart = startOfWeekIso(todayIso());
  const snapshot = useLiveQuery(
    async () => (await offlineDb.menuWeeks.get(weekStart)) ?? null,
    [weekStart],
  );
  if (snapshot === undefined) return <LoadingRows />;
  if (snapshot === null) {
    return (
      <>
        <OfflineHeader title="Меню на неделю" />
        <NoSnapshot title="Меню" />
      </>
    );
  }

  const today = todayIso();
  return (
    <>
      <OfflineHeader title="Меню на неделю" cachedAt={snapshot.cachedAt} />
      {snapshot.data.map((day) => {
        const meals = day.slots.filter((slot) => slot.meal !== null);
        return (
          <div key={day.date} className="mb-3 rounded-card border border-border bg-card px-[15px] py-3.5">
            <div className="mb-2 flex items-center gap-2.5">
              <WeekdayBadge date={day.date} isToday={day.date === today} />
              <span className="text-[15px] font-bold text-foreground">{weekdayName(day.date)}</span>
            </div>
            {meals.length === 0 ? (
              <p className="px-0.5 text-[12.5px] font-medium text-nav-inactive">
                Ничего не запланировано
              </p>
            ) : (
              meals.map((slot) => (
                <div key={slot.slotId} className="flex items-baseline gap-2 py-0.5 text-[13px]">
                  <span className="shrink-0 font-bold uppercase tracking-[0.03em] text-[10.5px] text-muted-foreground">
                    {slot.slotName}
                  </span>
                  <span className="truncate font-semibold text-foreground">{slot.meal?.title}</span>
                </div>
              ))
            )}
          </div>
        );
      })}
    </>
  );
}

// --- Рецепты ---

function OfflineRecipesScreen() {
  const snapshot = useLiveQuery(async () => (await offlineDb.recipeLists.get("all")) ?? null, []);
  if (snapshot === undefined) return <LoadingRows />;
  if (snapshot === null) {
    return (
      <>
        <OfflineHeader title="Рецепты" />
        <NoSnapshot title="Рецепты" />
      </>
    );
  }

  return (
    <>
      <OfflineHeader title="Рецепты" cachedAt={snapshot.cachedAt} />
      {snapshot.data.length === 0 ? (
        <EmptyState icon={BookOpen} title="Пока нет рецептов" />
      ) : (
        snapshot.data.map((recipe) => (
          <a
            key={recipe.id}
            href={`/recipes/${recipe.id}`}
            className="pressable mb-3 flex items-center gap-3 overflow-hidden rounded-card border border-border bg-card p-3"
          >
            <RecipePhoto
              photoUrl={recipe.photoUrl}
              width={64}
              height={64}
              className="size-16 rounded-lg"
            />
            <div className="min-w-0">
              <div className="truncate text-[15px] font-bold text-foreground">{recipe.title}</div>
              {recipe.cookTimeMinutes !== null && (
                <div className="text-[12px] font-semibold text-muted-foreground">
                  ~{recipe.cookTimeMinutes} мин
                </div>
              )}
            </div>
          </a>
        ))
      )}
    </>
  );
}

// Упрощённый офлайн-просмотр рецепта: без степпера порций и фото шагов — количества
// показываются на базовое число порций (полный экран требует сети).
function OfflineRecipeScreen({ id }: { id: string }) {
  const snapshot = useLiveQuery(async () => (await offlineDb.recipes.get(id)) ?? null, [id]);
  if (snapshot === undefined) return <LoadingRows />;
  if (snapshot === null) {
    return (
      <>
        <OfflineHeader title="Рецепт" />
        <NoSnapshot title="Рецепт" />
      </>
    );
  }

  const recipe = snapshot.data;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- офлайн-навигация должна быть полной загрузкой документа (её перехватывает SW), client-side переход без сети падает */}
      <a
        href="/recipes"
        className="mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-muted-foreground"
      >
        <ChevronLeft className="size-4" />
        Рецепты
      </a>
      <OfflineHeader
        title={recipe.title}
        eyebrow={recipe.cookTimeMinutes ? `Офлайн · ~${recipe.cookTimeMinutes} мин` : "Офлайн-режим"}
        cachedAt={snapshot.cachedAt}
      />

      <div className="mb-4 text-[13px] font-bold text-foreground">
        Ингредиенты · на {recipe.baseServings} порц.
      </div>
      <div className="mb-6 overflow-hidden rounded-card border border-border bg-card">
        {recipe.ingredients.map((ri) => (
          <div
            key={ri.id}
            className="flex items-center justify-between border-b border-secondary px-[15px] py-[11px] text-[14px] last:border-b-0"
          >
            <span className="font-semibold text-foreground">{ri.ingredient.name}</span>
            <span className="font-heading font-bold text-muted-foreground">
              {formatQuantity(ri.quantity, ri.unit)}
            </span>
          </div>
        ))}
      </div>

      <div className="mb-2 text-[13px] font-bold text-foreground">Приготовление</div>
      {recipe.steps.map((step, index) => (
        <div
          key={step.id}
          className="mb-3 flex items-start gap-[13px] rounded-card border border-border bg-card p-4"
        >
          <span className="flex size-[30px] shrink-0 items-center justify-center rounded-sm bg-primary font-heading text-sm font-extrabold text-primary-foreground">
            {index + 1}
          </span>
          <p className="mt-0.5 text-[14.5px] font-medium leading-[1.45] text-foreground">
            {step.instruction}
          </p>
        </div>
      ))}
    </>
  );
}

// --- Запасы ---

// Офлайн-инвентарь — только чтение: редактирование и удаление позиций требуют сети.
function OfflineInventoryScreen() {
  const snapshot = useLiveQuery(async () => (await offlineDb.pantry.get("all")) ?? null, []);
  if (snapshot === undefined) return <LoadingRows />;
  if (snapshot === null) {
    return (
      <>
        <OfflineHeader title="Запасы" />
        <NoSnapshot title="Запасы" />
      </>
    );
  }

  return (
    <>
      <OfflineHeader title="Запасы" cachedAt={snapshot.cachedAt} />
      {snapshot.data.length === 0 ? (
        <EmptyState icon={Refrigerator} title="Пока пусто" />
      ) : (
        snapshot.data.map((group) => (
          <CategorySection key={group.category} category={group.category} count={group.items.length}>
            {group.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b border-secondary px-[15px] py-[13px] last:border-b-0"
              >
                <span className="flex min-w-0 items-center gap-[11px]">
                  <CategoryDot category={group.category} />
                  <span className="truncate text-[14.5px] font-semibold text-foreground">
                    {item.ingredient.name}
                  </span>
                </span>
                <span className="shrink-0 font-heading text-[13.5px] font-bold text-muted-foreground">
                  {formatQuantity(item.quantity, item.unit)}
                </span>
              </div>
            ))}
          </CategorySection>
        ))
      )}
    </>
  );
}

// --- Список покупок ---

// Офлайн-список — только чтение всей недели: фильтр по дням и отметка "куплено" требуют
// сети (отметки без сети не буферизуются — см. CLAUDE.md §7, решение по офлайну).
function OfflineShoppingScreen() {
  const weekStart = startOfWeekIso(todayIso());
  const snapshot = useLiveQuery(
    async () => (await offlineDb.shoppingLists.get(weekStart)) ?? null,
    [weekStart],
  );
  if (snapshot === undefined) return <LoadingRows />;
  if (snapshot === null) {
    return (
      <>
        <OfflineHeader title="Список покупок" />
        <NoSnapshot title="Список покупок" />
      </>
    );
  }

  const groups = buildShoppingGroups(snapshot.data.items, null);
  return (
    <>
      <OfflineHeader title="Список покупок" cachedAt={snapshot.cachedAt} />
      {groups.length === 0 ? (
        <EmptyState icon={ShoppingBasket} title="Список пуст" />
      ) : (
        groups.map((group) => (
          <CategorySection key={group.category} category={group.category} count={group.items.length}>
            {group.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 border-b border-secondary px-[15px] py-[13px] last:border-b-0"
              >
                <BoughtCheckbox isBought={item.isBought} />
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2.5">
                  <span className="flex min-w-0 items-center gap-[11px]">
                    <CategoryDot category={item.category} />
                    <span
                      className={cn(
                        "truncate text-[14.5px] font-semibold",
                        item.isBought ? "text-nav-inactive line-through" : "text-foreground",
                      )}
                    >
                      {item.name}
                    </span>
                  </span>
                  <span className="shrink-0 font-heading text-[13.5px] font-bold text-muted-foreground">
                    {formatQuantity(item.needed, item.unit)}
                  </span>
                </span>
              </div>
            ))}
          </CategorySection>
        ))
      )}
    </>
  );
}
