import { FlatCompat } from "@eslint/eslintrc";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "lib/generated/**",
      "public/sw.js",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      // Сортировка импортов/экспортов — автофиксом (см. CLAUDE.md, раздел 10)
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      // Типы импортируются как типы: import type { X } / inline type-модификатор
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      // type по умолчанию; interface — только для declaration merging
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      // Запрет import * as React (см. CLAUDE.md, раздел 10)
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              importNames: ["default"],
              message: "Импортируй именованные значения/типы из react, не React целиком.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
