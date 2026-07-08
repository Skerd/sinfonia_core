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
        include: ["src/**/*.test.{ts,tsx}"],
        coverage: {
            provider: "v8",
            reporter: ["text", "html"],
            include: ["src/helpers/**/*.ts", "src/apps/**/*.tsx"],
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
