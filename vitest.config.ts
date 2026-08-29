import path from "path";
import {defineConfig} from "vitest/config";
import {
    buildViteModuleAliases,
    syncTsconfigModulePaths,
} from "./scripts/moduleAliases";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
syncTsconfigModulePaths();

export default defineConfig({
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: "./src/test/setup.ts",
        /* `scripts/` holds Node-side build tooling (the Studio's source index and
           writer); its tests run in the same suite rather than a separate one. */
        include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            include: ["src/helpers/**/*.ts", "src/modules/*/apps/**/*.tsx"],
        },
    },
    resolve: {
        alias: {
            ...buildViteModuleAliases(),
            "armonia/": `${path.resolve(__dirname, "../armonia")}/`,
            "@": path.resolve(__dirname, "./src/"),
        },
    },
});
