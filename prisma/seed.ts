import { PrismaClient, ProductCategory, UnitType } from "@prisma/client";

const prisma = new PrismaClient();

const starterIngredients: Array<{ name: string; defaultUnitType: UnitType; category: ProductCategory }> = [
  { name: "Молоко", defaultUnitType: "VOLUME", category: "DAIRY" },
  { name: "Яйца", defaultUnitType: "COUNT", category: "DAIRY" },
  { name: "Творог", defaultUnitType: "WEIGHT", category: "DAIRY" },
  { name: "Сыр", defaultUnitType: "WEIGHT", category: "DAIRY" },
  { name: "Куриное филе", defaultUnitType: "WEIGHT", category: "MEAT_FISH" },
  { name: "Фарш говяжий", defaultUnitType: "WEIGHT", category: "MEAT_FISH" },
  { name: "Лосось", defaultUnitType: "WEIGHT", category: "MEAT_FISH" },
  { name: "Лук репчатый", defaultUnitType: "COUNT", category: "VEGETABLES_FRUITS" },
  { name: "Помидор", defaultUnitType: "COUNT", category: "VEGETABLES_FRUITS" },
  { name: "Огурец", defaultUnitType: "COUNT", category: "VEGETABLES_FRUITS" },
  { name: "Картофель", defaultUnitType: "WEIGHT", category: "VEGETABLES_FRUITS" },
  { name: "Морковь", defaultUnitType: "WEIGHT", category: "VEGETABLES_FRUITS" },
  { name: "Рис", defaultUnitType: "WEIGHT", category: "GROCERY" },
  { name: "Гречка", defaultUnitType: "WEIGHT", category: "GROCERY" },
  { name: "Макароны", defaultUnitType: "WEIGHT", category: "GROCERY" },
  { name: "Соль", defaultUnitType: "WEIGHT", category: "GROCERY" },
  { name: "Хлеб", defaultUnitType: "COUNT", category: "BAKERY" },
  { name: "Вода питьевая", defaultUnitType: "VOLUME", category: "BEVERAGES" },
  { name: "Пельмени", defaultUnitType: "WEIGHT", category: "FROZEN" },
  { name: "Средство для мытья посуды", defaultUnitType: "VOLUME", category: "HOUSEHOLD_CHEMICALS" },
];

async function main() {
  for (const ingredient of starterIngredients) {
    await prisma.ingredient.upsert({
      where: { name: ingredient.name },
      update: {},
      create: ingredient,
    });
  }
  console.log(`Seeded ${starterIngredients.length} starter ingredients.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
