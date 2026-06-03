import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // กันรูปคนบีบ: ห้าม import shadcn avatar primitive ตรง — ต้องใช้ <PersonAvatar> (DESIGN.md Rule 14.13)
      "no-restricted-imports": ["error", {
        paths: [{
          name: "@/components/ui/avatar",
          message: "ใช้ <PersonAvatar> จาก @/components/shared/PersonAvatar แทน (กันรูปคนบีบ + initials fallback + a11y) — DESIGN.md Rule 14.13",
        }],
      }],
    },
  },
  // PersonAvatar คือไฟล์เดียวที่ได้รับอนุญาตให้ใช้ avatar primitive
  {
    files: ["src/components/shared/PersonAvatar.tsx"],
    rules: { "no-restricted-imports": "off" },
  },
);
