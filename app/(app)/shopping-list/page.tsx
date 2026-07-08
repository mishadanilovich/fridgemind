import { ScreenHeader } from "@/components/nav/ScreenHeader";

// Экран "Список покупок".
// TODO (см. CLAUDE.md, раздел 6, потоки "фильтр по дням", "отметил что купил",
// "массовое обновление инвентаря", "общий список покупок в реальном времени"):
// - чипы-фильтр по дням: Сегодня/Завтра/Вся неделя (по умолчанию)/Выбрать дни
// - группировка по ProductCategory, отметка "куплено" мгновенная (без модалки)
// - ручное добавление позиции с обязательным выбором ProductCategory (по умолчанию OTHER)
// - кнопка "Добавить в запасы" — видна, если есть isBought && !addedToPantry
// - подписка на Supabase Realtime по household — изменения других участников видны сразу
export default function ShoppingListPage() {
  return (
    <div className="space-y-4">
      <ScreenHeader eyebrow="На неделю" title="Список покупок" />
      <p className="text-sm text-muted-foreground">
        Список покупок ещё не реализован — см. CLAUDE.md, раздел 6.
      </p>
    </div>
  );
}
