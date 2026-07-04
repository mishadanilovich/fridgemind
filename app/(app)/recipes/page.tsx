// Экран "Рецепты".
// TODO (см. CLAUDE.md, раздел 6):
// - карточка "+ Добавить рецепт" ПЕРВЫМ элементом списка, не кнопкой в шапке
// - на карточках: бейджи CookingMethod, cookTimeMinutes, редактирование/удаление (с подтверждением)
// - фильтр "что приготовить из того, что есть" — % совпадения с PantryItem
// - для роли MEMBER: карточка добавления и редактирование/удаление не показываются (только просмотр)
export default function RecipesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Рецепты</h1>
      <p className="text-sm text-muted-foreground">
        Список рецептов ещё не реализован — см. CLAUDE.md, раздел 6.
      </p>
    </div>
  );
}
