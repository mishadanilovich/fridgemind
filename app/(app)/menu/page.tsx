import { ScreenHeader } from "@/components/nav/ScreenHeader";

// Экран "Меню на неделю".
// TODO (см. CLAUDE.md, раздел 6):
// - 7 дней, в каждом дне — слоты MealSlot household'а в заданном порядке
// - назначенный рецепт можно "убрать" (действие отдельное от "заменить")
// - максимум 3 карточки видно одновременно в дне (заполненные + "+ добавить рецепт" для EDITOR/ORGANIZER),
//   остальное — горизонтальная карусель/свайп внутри блока дня
// - для роли MEMBER пустые слоты не показываются вовсе, редактирование недоступно
export default function MenuPage() {
  return (
    <div className="space-y-4">
      <ScreenHeader eyebrow="Планирование" title="Меню на неделю" />
      <p className="text-sm text-muted-foreground">
        Конструктор недели ещё не реализован — см. CLAUDE.md, раздел 6.
      </p>
    </div>
  );
}
