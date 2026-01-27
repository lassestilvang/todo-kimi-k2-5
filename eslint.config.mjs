import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Test files - allow require() imports for test setup
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/test-setup.ts", "**/test-helpers.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Database files - allow require() for runtime detection
  {
    files: ["**/db/index.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
