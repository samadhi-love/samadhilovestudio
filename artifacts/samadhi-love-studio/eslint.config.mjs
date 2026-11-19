import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    "dist/**",
    ".vinext/**",
    ".wrangler/**",
    ".sites-runtime/**",
    "outputs/**",
    "work/**",
    // Local, untracked build/test leftovers; scanning them exhausts memory.
    "generated-artifacts/**",
    "vendor/**",
  ]),
  {
    // Stale values in effects and callbacks caused real lost-save bugs. Every
    // remaining exception is reviewed and carries its reason inline.
    files: ["app/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/exhaustive-deps": "error",
      // Deliberate: the public site, sign-in/sign-up/sign-out and the Studio are
      // separate sections. Plain links give each a full load with fresh sign-in
      // state; next/link is not used anywhere in this app.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  {
    files: ["components/ui/**/*.{ts,tsx}", "hooks/use-mobile.ts"],
    rules: {
      // These files are vendored verbatim from shadcn@4.17.0. Keep the
      // registry source intact while applying the stricter rules to Site code.
      "@typescript-eslint/no-unused-vars": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
