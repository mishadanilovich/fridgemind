-- CreateEnum
CREATE TYPE "household_role" AS ENUM ('ORGANIZER', 'EDITOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "unit_type" AS ENUM ('WEIGHT', 'VOLUME', 'COUNT');

-- CreateEnum
CREATE TYPE "unit" AS ENUM ('G', 'ML', 'PCS');

-- CreateEnum
CREATE TYPE "product_category" AS ENUM ('DAIRY', 'MEAT_FISH', 'VEGETABLES_FRUITS', 'GROCERY', 'BAKERY', 'BEVERAGES', 'FROZEN', 'HOUSEHOLD_CHEMICALS', 'PERSONAL_CARE', 'OTHER');

-- CreateEnum
CREATE TYPE "cooking_method" AS ENUM ('STOVETOP', 'OVEN', 'MULTICOOKER', 'GRILL', 'MICROWAVE', 'NO_COOK');

-- CreateEnum
CREATE TYPE "pantry_item_source" AS ENUM ('MANUAL', 'PHOTO');

-- CreateTable
CREATE TABLE "households" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "invite_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "role" "household_role" NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "default_unit_type" "unit_type" NOT NULL,
    "category" "product_category" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "photo_url" TEXT,
    "base_servings" INTEGER NOT NULL,
    "cook_time_minutes" INTEGER,
    "cooking_methods" "cooking_method"[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_steps" (
    "id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "instruction" TEXT NOT NULL,
    "photo_url" TEXT,

    CONSTRAINT "recipe_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "ingredient_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" "unit" NOT NULL,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pantry_items" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "ingredient_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" "unit" NOT NULL,
    "added_via" "pantry_item_source" NOT NULL DEFAULT 'MANUAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pantry_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_slots" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_weeks" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "week_start_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_days" (
    "id" TEXT NOT NULL,
    "menu_week_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_day_meals" (
    "id" TEXT NOT NULL,
    "menu_day_id" TEXT NOT NULL,
    "meal_slot_id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "servings" INTEGER NOT NULL,
    "is_eaten" BOOLEAN NOT NULL DEFAULT false,
    "eaten_at" TIMESTAMP(3),
    "eaten_by_user_id" TEXT,

    CONSTRAINT "menu_day_meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_list_items" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "week_id" TEXT NOT NULL,
    "ingredient_id" TEXT,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" "unit" NOT NULL,
    "is_bought" BOOLEAN NOT NULL DEFAULT false,
    "added_to_pantry" BOOLEAN NOT NULL DEFAULT false,
    "is_manual" BOOLEAN NOT NULL DEFAULT false,
    "manual_category" "product_category",
    "bought_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopping_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopping_list_item_meals" (
    "id" TEXT NOT NULL,
    "shopping_list_item_id" TEXT NOT NULL,
    "menu_day_meal_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "shopping_list_item_meals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "households_invite_code_key" ON "households"("invite_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_household_id_idx" ON "users"("household_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_name_key" ON "ingredients"("name");

-- CreateIndex
CREATE INDEX "recipes_household_id_idx" ON "recipes"("household_id");

-- CreateIndex
CREATE INDEX "recipe_steps_recipe_id_idx" ON "recipe_steps"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_ingredients_recipe_id_idx" ON "recipe_ingredients"("recipe_id");

-- CreateIndex
CREATE INDEX "recipe_ingredients_ingredient_id_idx" ON "recipe_ingredients"("ingredient_id");

-- CreateIndex
CREATE INDEX "pantry_items_household_id_idx" ON "pantry_items"("household_id");

-- CreateIndex
CREATE UNIQUE INDEX "pantry_items_household_id_ingredient_id_key" ON "pantry_items"("household_id", "ingredient_id");

-- CreateIndex
CREATE INDEX "meal_slots_household_id_idx" ON "meal_slots"("household_id");

-- CreateIndex
CREATE INDEX "menu_weeks_household_id_idx" ON "menu_weeks"("household_id");

-- CreateIndex
CREATE INDEX "menu_days_menu_week_id_idx" ON "menu_days"("menu_week_id");

-- CreateIndex
CREATE INDEX "menu_day_meals_menu_day_id_idx" ON "menu_day_meals"("menu_day_id");

-- CreateIndex
CREATE INDEX "menu_day_meals_recipe_id_idx" ON "menu_day_meals"("recipe_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_day_meals_menu_day_id_meal_slot_id_key" ON "menu_day_meals"("menu_day_id", "meal_slot_id");

-- CreateIndex
CREATE INDEX "shopping_list_items_household_id_idx" ON "shopping_list_items"("household_id");

-- CreateIndex
CREATE INDEX "shopping_list_items_week_id_idx" ON "shopping_list_items"("week_id");

-- CreateIndex
CREATE INDEX "shopping_list_item_meals_shopping_list_item_id_idx" ON "shopping_list_item_meals"("shopping_list_item_id");

-- CreateIndex
CREATE INDEX "shopping_list_item_meals_menu_day_meal_id_idx" ON "shopping_list_item_meals"("menu_day_meal_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pantry_items" ADD CONSTRAINT "pantry_items_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pantry_items" ADD CONSTRAINT "pantry_items_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_slots" ADD CONSTRAINT "meal_slots_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_weeks" ADD CONSTRAINT "menu_weeks_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_days" ADD CONSTRAINT "menu_days_menu_week_id_fkey" FOREIGN KEY ("menu_week_id") REFERENCES "menu_weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_day_meals" ADD CONSTRAINT "menu_day_meals_menu_day_id_fkey" FOREIGN KEY ("menu_day_id") REFERENCES "menu_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_day_meals" ADD CONSTRAINT "menu_day_meals_meal_slot_id_fkey" FOREIGN KEY ("meal_slot_id") REFERENCES "meal_slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_day_meals" ADD CONSTRAINT "menu_day_meals_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_day_meals" ADD CONSTRAINT "menu_day_meals_eaten_by_user_id_fkey" FOREIGN KEY ("eaten_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_week_id_fkey" FOREIGN KEY ("week_id") REFERENCES "menu_weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_bought_by_user_id_fkey" FOREIGN KEY ("bought_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_item_meals" ADD CONSTRAINT "shopping_list_item_meals_shopping_list_item_id_fkey" FOREIGN KEY ("shopping_list_item_id") REFERENCES "shopping_list_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopping_list_item_meals" ADD CONSTRAINT "shopping_list_item_meals_menu_day_meal_id_fkey" FOREIGN KEY ("menu_day_meal_id") REFERENCES "menu_day_meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
