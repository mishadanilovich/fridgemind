import { ScreenHeader } from "@/components/nav/ScreenHeader";

// Экран "Сегодня" — главный экран/точка входа.
// TODO (см. CLAUDE.md, раздел 6 "Основные экраны" + поток "отметил, что скушал"):
// - слоты приёма пищи текущего дня в порядке, заданном household в Профиле
// - на каждом: фото/название рецепта, cookTimeMinutes + бейджи CookingMethod, кнопка "скушано"
// - "скушано" -> мгновенно MenuDayMeal.isEaten = true, затем необязательный bottom sheet
//   "Списать использованные продукты?" со степпером порций
// - пустые слоты не показываются для роли MEMBER (раздел 5 "Роли в household")
export default function TodayPage() {
  const dayOfWeek = new Date().toLocaleDateString("ru-RU", { weekday: "long" }).toUpperCase();

  return (
    <div className="space-y-4">
      <ScreenHeader eyebrow={dayOfWeek} title="Сегодня" />
      <p className="text-sm text-muted-foreground">
        Здесь появятся приёмы пищи на сегодня. Экран ещё не реализован — см. CLAUDE.md, раздел 6.
      </p>
    </div>
  );
}
