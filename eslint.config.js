import mantine from "eslint-config-mantine";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";

// @ts-check
export default defineConfig(
  tseslint.configs.recommended,
  ...mantine,
  { ignores: ["**/*.{mjs,cjs,js,d.ts,d.mts}"] },
  {
    plugins: {
      "@stylistic": stylistic,
    },
    files: ["src/**/*"],
    rules: {
      "no-console": "off",
      "@stylistic/quotes": ["error", "double", { "avoidEscape": true }],
      "@stylistic/comma-dangle": ["error", "always-multiline"]
    },
  },
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: process.cwd(),
        project: ["./tsconfig.json"],
      },
    },
  }
);
