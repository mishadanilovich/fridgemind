// Календарные даты меню — строки "YYYY-MM-DD". В БД (MenuDay.date, MenuWeek.weekStartDate)
// они лежат как полночь UTC: день недели не должен зависеть от часового пояса сервера.
//
// Единственное место, где нужен часовой пояс, — определение "какое сегодня число" для экрана
// "Сегодня" и текущей недели. Сервер на Vercel живёт в UTC, поэтому дату считаем в зоне
// household'а; смена зоны — правка одной этой константы.
export const APP_TIME_ZONE = "Europe/Moscow";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// en-CA даёт ровно "YYYY-MM-DD".
const isoInAppZone = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Формата мало: Date молча перекатывает несуществующие даты ("2026-02-30" → 2 марта), поэтому
// дата считается валидной, только если переживает round-trip без сдвига.
export function isIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function todayIso(now: Date = new Date()): string {
  return isoInAppZone.format(now);
}

/** ISO-дата → полночь UTC (значение для колонок MenuDay.date / MenuWeek.weekStartDate). */
export function isoToDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function dateToIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDaysIso(iso: string, days: number): string {
  const date = isoToDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return dateToIso(date);
}

/** Понедельник недели, в которую попадает дата (неделя пн–вс). */
export function startOfWeekIso(iso: string): string {
  const weekday = isoToDate(iso).getUTCDay(); // 0 — воскресенье
  const daysFromMonday = (weekday + 6) % 7;
  return addDaysIso(iso, -daysFromMonday);
}

export function weekDatesIso(weekStartIso: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysIso(weekStartIso, i));
}

// Дни недели и месяцы — Record по литеральным ключам, а не массив: getUTCDay()/getUTCMonth()
// возвращают заведомо валидный индекс, и так это видит и TypeScript (strict-индексация).
type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type MonthIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

const WEEKDAY_SHORT: Record<WeekdayIndex, string> = {
  0: "Вс",
  1: "Пн",
  2: "Вт",
  3: "Ср",
  4: "Чт",
  5: "Пт",
  6: "Сб",
};

const WEEKDAY_FULL: Record<WeekdayIndex, string> = {
  0: "Воскресенье",
  1: "Понедельник",
  2: "Вторник",
  3: "Среда",
  4: "Четверг",
  5: "Пятница",
  6: "Суббота",
};

const MONTH_GENITIVE: Record<MonthIndex, string> = {
  0: "января",
  1: "февраля",
  2: "марта",
  3: "апреля",
  4: "мая",
  5: "июня",
  6: "июля",
  7: "августа",
  8: "сентября",
  9: "октября",
  10: "ноября",
  11: "декабря",
};

function weekdayIndex(date: Date): WeekdayIndex {
  return date.getUTCDay() as WeekdayIndex;
}

function monthName(date: Date): string {
  return MONTH_GENITIVE[date.getUTCMonth() as MonthIndex];
}

export function weekdayShort(iso: string): string {
  return WEEKDAY_SHORT[weekdayIndex(isoToDate(iso))];
}

export function weekdayName(iso: string): string {
  return WEEKDAY_FULL[weekdayIndex(isoToDate(iso))];
}

/** "Понедельник, 11 июля" — заголовок дня. */
export function formatDayTitle(iso: string): string {
  const date = isoToDate(iso);
  return `${weekdayName(iso)}, ${date.getUTCDate()} ${monthName(date)}`;
}

/** "5 июля" — день и месяц без дня недели (подпись даты создания шаблона). */
export function formatShortDate(iso: string): string {
  const date = isoToDate(iso);
  return `${date.getUTCDate()} ${monthName(date)}`;
}

/** "6 — 12 июля" — подзаголовок недели. */
export function formatWeekRange(weekStartIso: string): string {
  const start = isoToDate(weekStartIso);
  const end = isoToDate(addDaysIso(weekStartIso, 6));
  const startPart =
    start.getUTCMonth() === end.getUTCMonth()
      ? String(start.getUTCDate())
      : `${start.getUTCDate()} ${monthName(start)}`;
  return `${startPart} — ${end.getUTCDate()} ${monthName(end)}`;
}
