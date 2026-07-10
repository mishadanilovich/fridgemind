import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const DEFAULT_DAILY_LIMIT = 20;

export function visionDailyLimit(): number {
  const parsed = Number(process.env.VISION_DAILY_LIMIT);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_LIMIT;
}

function utcToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// Атомарно занимает один вызов из дневного лимита household: инкремент проходит только пока
// count < limit, поэтому гонка параллельных запросов не пробивает лимит.
export async function consumeVisionCall(householdId: string): Promise<boolean> {
  const limit = visionDailyLimit();
  const day = utcToday();

  const increment = () =>
    prisma.visionUsage.updateMany({
      where: { householdId, day, count: { lt: limit } },
      data: { count: { increment: 1 } },
    });

  if ((await increment()).count === 1) return true;

  // Строки за сегодня ещё нет — создаём; при гонке (P2002) другой запрос успел первым,
  // тогда повторяем инкремент.
  try {
    await prisma.visionUsage.create({ data: { householdId, day, count: 1 } });
    return true;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return (await increment()).count === 1;
    }
    throw e;
  }
}

// Возвращает занятый вызов в лимит, если распознавание не состоялось (ошибка API, невалидный
// ответ модели) — квота списывается только за реально удавшиеся распознавания.
export async function releaseVisionCall(householdId: string): Promise<void> {
  await prisma.visionUsage.updateMany({
    where: { householdId, day: utcToday(), count: { gt: 0 } },
    data: { count: { decrement: 1 } },
  });
}
