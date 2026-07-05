// Форма создания/редактирования рецепта.
// TODO (см. CLAUDE.md, раздел 5 "Ввод рецептов" + zod-схема recipeInputSchema в lib/zod-schemas.ts):
// - название, базовое число порций, мультиселект CookingMethod
// - ингредиенты из справочника Ingredient (автокомплит/создание нового)
// - шаги приготовления по одному — каждый со своим текстом и опциональным фото (не одно большое поле)
export default function NewRecipePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Новый рецепт</h1>
      <p className="text-sm text-muted-foreground">
        Форма ещё не реализована — см. CLAUDE.md, раздел 5 «Ввод рецептов».
      </p>
    </div>
  );
}
