"use server";

import { revalidatePath } from "next/cache";

import { ensureMenuWeek } from "@/lib/actions/menu";
import { requireRole } from "@/lib/auth";
import { dateToIso, isoToDate } from "@/lib/dates";
import { type ActionResult, firstIssue } from "@/lib/form-state";
import {
  MENU_TEMPLATE_LIMIT,
  resolveTemplateApplication,
  type TemplateMealDraft,
  weekMealsToTemplateDrafts,
} from "@/lib/menu";
import { prisma } from "@/lib/prisma";
import { isoDateSchema, menuTemplateNameSchema } from "@/lib/zod-schemas";

// Шаблоны меню — только Организатор/Редактор (см. CLAUDE.md §5, RLS menu_templates).

const LIMIT_REACHED = `Достигнут лимит в ${MENU_TEMPLATE_LIMIT} шаблона, удалите один, чтобы сохранить новый`;

// Применение накатывает MenuDayMeal сразу на несколько дней недели, поэтому инвалидируем весь
// раздел меню (layout покрывает и /menu/[date]) и "Сегодня". Список покупок пересинхронизируется
// сам при следующем чтении (syncWeekItems), как и после assignMeal.
function revalidateMenuTree() {
  revalidatePath("/");
  revalidatePath("/menu", "layout");
}

function revalidateTemplates() {
  revalidatePath("/menu", "layout");
}

export async function saveMenuTemplate(weekStartIso: string, name: string): Promise<ActionResult> {
  const user = await requireRole(["ORGANIZER", "EDITOR"]);
  if (!user) return { error: "Недостаточно прав" };

  const parsedName = menuTemplateNameSchema.safeParse(name);
  if (!parsedName.success) return { error: firstIssue(parsedName.error.issues) };
  const parsedWeek = isoDateSchema.safeParse(weekStartIso);
  if (!parsedWeek.success) return { error: "Некорректная неделя" };

  const result = await prisma.$transaction(async (tx): Promise<ActionResult> => {
    // Лимит проверяется здесь, а не только в UI: это источник истины, и он же защищает от
    // гонки двух параллельных сохранений (обе транзакции сериализуются на этой таблице).
    const count = await tx.menuTemplate.count({ where: { householdId: user.householdId } });
    if (count >= MENU_TEMPLATE_LIMIT) return { error: LIMIT_REACHED };

    // Только активные слоты/рецепты попадают в шаблон: приём пищи в soft-deleted слоте или с
    // soft-deleted рецептом при применении всё равно был бы пропущен, незачем его сохранять.
    const meals = await tx.menuDayMeal.findMany({
      where: {
        menuDay: {
          menuWeek: { householdId: user.householdId, weekStartDate: isoToDate(parsedWeek.data) },
        },
        mealSlot: { deletedAt: null },
        recipe: { deletedAt: null },
      },
      select: {
        mealSlotId: true,
        recipeId: true,
        servings: true,
        menuDay: { select: { date: true } },
      },
    });

    const drafts = weekMealsToTemplateDrafts(
      meals.map((m) => ({
        dateIso: dateToIso(m.menuDay.date),
        mealSlotId: m.mealSlotId,
        recipeId: m.recipeId,
        servings: m.servings,
      })),
      parsedWeek.data,
    );
    if (drafts.length === 0) return { error: "На этой неделе ничего не запланировано" };

    await tx.menuTemplate.create({
      data: {
        householdId: user.householdId,
        name: parsedName.data,
        meals: { createMany: { data: drafts } },
      },
    });
    return { error: null };
  });
  if (result.error) return result;

  revalidateTemplates();
  return { error: null };
}

export async function applyMenuTemplate(
  templateId: string,
  weekStartIso: string,
): Promise<ActionResult> {
  const user = await requireRole(["ORGANIZER", "EDITOR"]);
  if (!user) return { error: "Недостаточно прав" };

  const parsedWeek = isoDateSchema.safeParse(weekStartIso);
  if (!parsedWeek.success) return { error: "Некорректная неделя" };
  const weekStartDate = isoToDate(parsedWeek.data);

  const result = await prisma.$transaction(async (tx): Promise<ActionResult> => {
    // Шаблон — обязательно свой household: id приходит с клиента.
    const template = await tx.menuTemplate.findFirst({
      where: { id: templateId, householdId: user.householdId },
      select: {
        meals: { select: { dayOfWeek: true, mealSlotId: true, recipeId: true, servings: true } },
      },
    });
    if (!template) return { error: "Шаблон не найден" };

    const [slots, recipes] = await Promise.all([
      tx.mealSlot.findMany({
        where: { householdId: user.householdId, deletedAt: null },
        select: { id: true },
      }),
      tx.recipe.findMany({
        where: { householdId: user.householdId, deletedAt: null },
        select: { id: true },
      }),
    ]);

    const drafts: TemplateMealDraft[] = template.meals;
    const applications = resolveTemplateApplication(
      drafts,
      new Set(slots.map((s) => s.id)),
      new Set(recipes.map((r) => r.id)),
      parsedWeek.data,
    );
    // Все слоты/рецепты шаблона удалены с момента сохранения — накатывать нечего.
    if (applications.length === 0) {
      return { error: "Рецепты и слоты этого шаблона больше не существуют" };
    }

    const week = await ensureMenuWeek(tx, user.householdId, weekStartDate);

    // Один upsert дня на каждую задействованную дату, дальше — по одному приёму пищи.
    const dayIdByDate = new Map<string, string>();
    for (const dateIso of new Set(applications.map((a) => a.dateIso))) {
      const day = await tx.menuDay.upsert({
        where: { menuWeekId_date: { menuWeekId: week.id, date: isoToDate(dateIso) } },
        create: { menuWeekId: week.id, date: isoToDate(dateIso) },
        update: {},
        select: { id: true },
      });
      dayIdByDate.set(dateIso, day.id);
    }

    // Перезаписываем только затронутые слоты (upsert по дню+слоту); остальное в неделе не трогаем.
    for (const app of applications) {
      const menuDayId = dayIdByDate.get(app.dateIso) as string;
      await tx.menuDayMeal.upsert({
        where: { menuDayId_mealSlotId: { menuDayId, mealSlotId: app.mealSlotId } },
        create: {
          menuDayId,
          mealSlotId: app.mealSlotId,
          recipeId: app.recipeId,
          servings: app.servings,
        },
        update: { recipeId: app.recipeId, servings: app.servings },
      });
    }
    return { error: null };
  });
  if (result.error) return result;

  revalidateMenuTree();
  return { error: null };
}

export async function renameMenuTemplate(templateId: string, name: string): Promise<ActionResult> {
  const user = await requireRole(["ORGANIZER", "EDITOR"]);
  if (!user) return { error: "Недостаточно прав" };

  const parsed = menuTemplateNameSchema.safeParse(name);
  if (!parsed.success) return { error: firstIssue(parsed.error.issues) };

  const updated = await prisma.menuTemplate.updateMany({
    where: { id: templateId, householdId: user.householdId },
    data: { name: parsed.data },
  });
  if (updated.count === 0) return { error: "Шаблон не найден" };

  revalidateTemplates();
  return { error: null };
}

export async function deleteMenuTemplate(templateId: string): Promise<ActionResult> {
  const user = await requireRole(["ORGANIZER", "EDITOR"]);
  if (!user) return { error: "Недостаточно прав" };

  // Приёмы пищи шаблона уходят каскадом (menu_template_meals FK on delete cascade).
  const deleted = await prisma.menuTemplate.deleteMany({
    where: { id: templateId, householdId: user.householdId },
  });
  if (deleted.count === 0) return { error: "Шаблон не найден" };

  revalidateTemplates();
  return { error: null };
}
