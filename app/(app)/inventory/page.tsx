import { ScreenHeader } from "@/components/nav/ScreenHeader";

// Экран "Домашние запасы (инвентарь)".
// TODO (см. CLAUDE.md, раздел 6 "Поток фото холодильника"):
// - список PantryItem, сгруппированный по ProductCategory, с редактированием/удалением
// - кнопка "сфотографировать холодильник" — несколько фото за один заход (полоска миниатюр,
//   "Добавить ещё фото" / "Готово, распознать"), один общий экран с объединённым списком
export default function InventoryPage() {
  return (
    <div className="space-y-4">
      <ScreenHeader eyebrow="Дома есть" title="Запасы" />
      <p className="text-sm text-muted-foreground">
        Инвентарь ещё не реализован — см. CLAUDE.md, раздел 6.
      </p>
    </div>
  );
}
