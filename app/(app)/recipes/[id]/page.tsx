// Просмотр рецепта.
// TODO (см. CLAUDE.md, раздел 5 "Порции"):
// - степпер числа порций рядом с названием, пересчитывающий RecipeIngredient.quantity
//   пропорционально (scaleQuantity() из lib/utils.ts)
// - шаги приготовления пролистываются по одному, с фото сверху, если есть
export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Рецепт {id}</h1>
      <p className="text-sm text-muted-foreground">
        Просмотр рецепта ещё не реализован — см. CLAUDE.md, раздел 5 "Порции".
      </p>
    </div>
  );
}
