import { weekdayShort } from "@/lib/dates";
import { cn } from "@/lib/utils";

type Props = {
  date: string;
  isToday: boolean;
};

/** Квадратик "Пн/Вт/…" у заголовка дня — общий для "Меню на неделю" и офлайн-просмотра. */
export function WeekdayBadge({ date, isToday }: Props) {
  return (
    <span
      className={cn(
        "flex size-9 items-center justify-center rounded-md font-heading text-sm font-extrabold",
        isToday ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground",
      )}
    >
      {weekdayShort(date)}
    </span>
  );
}
