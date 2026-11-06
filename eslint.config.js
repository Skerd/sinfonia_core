import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";

/*
 * Governance rules (D09, D22, D23, D36). Existing findings are frozen in the root lint baseline
 * (scripts/checks/baselines/lint.json); only new ones fail `npm run verify`.
 */

const DATE_LIBRARIES = "Use dayjs or core helpers/general/dateTime.ts (D36).";
const ICONS = "Icons come from @tabler/icons-react; brand logos from @icons-pack/react-simple-icons (D22).";
const ANIMATE_UI = "animate-ui is used only inside a core components/ui primitive (D22).";
const AXIOS = "Call the API through withAxios / useHttpRequest; apiClient is the only axios instance (D09).";
const API_CLIENT = "Call the API through withAxios or useHttpRequest; apiClient directly only in core helpers (D09).";
const RAW_HTML = "Use the core components/ui primitive instead of raw <button>, <select>, <table> or <input> (D22).";
const RAW_FETCH = "Call the API through withAxios / useHttpRequest, never raw fetch (D09).";

/** One `no-restricted-imports` per scope (a later config replaces the whole rule), so scopes drop what they may use. */
function restrictedImports({icons = true, animateUi = true, axios = true, apiClient = true} = {}) {
  const paths = ["date-fns", "moment", "moment-timezone"].map((name) => ({name, message: DATE_LIBRARIES}));
  if (icons) paths.push(...["lucide-react", "@radix-ui/react-icons", "@remixicon/react", "react-icons"].map((name) => ({name, message: ICONS})));
  if (axios) paths.push({name: "axios", message: AXIOS, allowTypeImports: true});
  const patterns = [{group: ["date-fns/*"], message: DATE_LIBRARIES}];
  if (animateUi) patterns.push({group: ["**/animate-ui/**"], message: ANIMATE_UI});
  if (apiClient) patterns.push({group: ["**/helpers/apiClient/apiClient*"], message: API_CLIENT, allowTypeImports: true});
  return ["error", {paths, patterns}];
}

const RAW_HTML_SYNTAX = ["error", {selector: "JSXOpeningElement[name.name=/^(button|select|table|input)$/]", message: RAW_HTML}];

export default tseslint.config(
  { ignores: ["dist", "node_modules", "**/apps/public/**", "**/apps/shop/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // D23: the jsx-a11y recommended set is an error in every app.
      ...jsxA11y.flatConfigs.recommended.rules,
      // Our primitives are controls too; a label may wrap its text in two spans (title + hint).
      "jsx-a11y/label-has-associated-control": ["error", {
        controlComponents: ["Input", "Textarea", "Checkbox", "Switch", "RadioGroupItem", "SelectTrigger", "PhoneInput", "DateInput"],
        depth: 3,
      }],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-restricted-imports": "off",
      "@typescript-eslint/no-restricted-imports": restrictedImports(),
      "no-restricted-globals": ["error", {name: "fetch", message: RAW_FETCH}],
      "no-restricted-syntax": RAW_HTML_SYNTAX,
    },
  },
  // The primitive layer itself: shadcn primitives wrap raw elements, lucide icons and animate-ui.
  {
    files: ["src/modules/core/components/ui/**", "src/modules/core/components/animate-ui/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": restrictedImports({icons: false, animateUi: false}),
      "no-restricted-syntax": "off",
    },
  },
  // Core helpers and hooks may use apiClient directly; apiClient itself (and the public chat client, FE-03) create axios.
  {
    files: ["src/modules/core/helpers/**"],
    ignores: ["src/modules/core/helpers/apiClient/**", "src/modules/core/helpers/chat/publicChat/publicChatClient.ts"],
    rules: {"@typescript-eslint/no-restricted-imports": restrictedImports({apiClient: false})},
  },
  {
    files: ["src/modules/core/helpers/apiClient/**", "src/modules/core/helpers/chat/publicChat/publicChatClient.ts"],
    rules: {"@typescript-eslint/no-restricted-imports": restrictedImports({apiClient: false, axios: false})},
  },
  // FE-03's listed raw-fetch exceptions: media bytes, and the Studio's dev-only source client.
  {
    files: ["src/modules/core/helpers/media/fetchMediaBytes.ts", "src/modules/core/clients/studio/source/sourceClient.ts"],
    rules: {"no-restricted-globals": "off"},
  },
  // Tests mock the API and render raw markup on purpose.
  {
    files: ["**/_tests/**", "**/*.test.{ts,tsx}", "scripts/**"],
    rules: {
      "@typescript-eslint/no-restricted-imports": restrictedImports({icons: false, animateUi: false, axios: false, apiClient: false}),
      "no-restricted-globals": "off",
      "no-restricted-syntax": "off",
    },
  },
);
