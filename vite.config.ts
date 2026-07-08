import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";
import {defineConfig, loadEnv, normalizePath, type Plugin} from 'vite';
//@ts-ignore
import react from '@vitejs/plugin-react';
//@ts-ignore
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import {createRequire} from "node:module";
// import checker from "vite-plugin-checker";
import {visualizer} from "rollup-plugin-visualizer";
import { resolveSinfoniaAppId } from "./src/apps/registry";
import { buildViteModuleAliases, syncTsconfigModulePaths, } from "./scripts/moduleAliases";

const require = createRequire(import.meta.url);
const cMapsDir = normalizePath(
    path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'cmaps'),
);
const standardFontsDir = normalizePath(
    path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'standard_fonts'),
);
const wasmDir = normalizePath(
    path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'wasm'),
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function sinfoniaAppHtmlPlugin(appId: string): Plugin {
    const appHtmlPath = path.resolve(__dirname, "src/apps", appId, "index.html");
    const rootHtmlPath = path.resolve(__dirname, "index.html");

    return {
        name: "sinfonia-app-html",
        buildStart() {
            if (!fs.existsSync(appHtmlPath)) {
                throw new Error(`Missing ${appHtmlPath} for client "${appId}".`);
            }
        },
        transformIndexHtml: {
            order: "pre",
            handler(html, ctx) {
                if (path.normalize(ctx.filename) !== path.normalize(rootHtmlPath)) {
                    return html;
                }
                return fs.readFileSync(appHtmlPath, "utf-8");
            },
        },
    };
}

/**
 * When `VITE_ENABLED_MODULES` is set, stub files under disabled `src/modules/<name>`
 * packages so eager contribution globs do not pull them into the graph.
 * `core` is always kept.
 */
function enabledModulesExcludePlugin(rawEnv: string | undefined): Plugin {
    const raw = rawEnv?.trim();
    if (!raw) {
        return {name: "sinfonia-enabled-modules"};
    }
    const enabled = new Set([
        "core",
        ...raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
    ]);
    const marker = "/src/modules/";

    return {
        name: "sinfonia-enabled-modules",
        enforce: "pre",
        load(id) {
            const normalized = id.split("?")[0]!.replace(/\\/g, "/");
            const idx = normalized.indexOf(marker);
            if (idx === -1) {
                return null;
            }
            const moduleName = normalized.slice(idx + marker.length).split("/")[0];
            if (!moduleName || enabled.has(moduleName)) {
                return null;
            }
            if (/\.(?:[cm]?[jt]sx?)$/.test(normalized)) {
                return "export default undefined;\n";
            }
            if (normalized.endsWith(".json")) {
                return "export default {};\n";
            }
            return null;
        },
    };
}


export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, __dirname, "");
    const enabledModulesRaw =
        process.env.VITE_ENABLED_MODULES ?? env.VITE_ENABLED_MODULES;
    const sinfoniaAppId = resolveSinfoniaAppId(
        process.env.VITE_SINFONIA_APP ?? env.VITE_SINFONIA_APP,
    );
    // Scan `src/modules/*` → `@${dir}Module` aliases; keep tsconfig `paths` in sync for the IDE.
    syncTsconfigModulePaths();

    return {
        plugins: [
            enabledModulesExcludePlugin(enabledModulesRaw),
            sinfoniaAppHtmlPlugin(sinfoniaAppId),
            // checker({
            //     typescript: true
            // }),
            viteStaticCopy({
                targets: [
                    { src: cMapsDir, dest: "" },
                    { src: standardFontsDir, dest: "" },
                    { src: wasmDir, dest: "" },
                ],
            }),
            visualizer({
                filename: "dist/bundle-analysis.html",
                open: false,
                gzipSize: true,
                brotliSize: true,
            }),
            react(),
            tailwindcss(),
        ],
        resolve: {
            // Prefer .ts over stale compiled .js siblings under ../armonia/src (CJS exports break ESM named imports).
            extensions: [".ts", ".tsx", ".mts", ".mjs", ".js", ".jsx", ".json"],
            alias: {
                ...buildViteModuleAliases(),
                "armonia/": `${path.resolve(__dirname, "../armonia")}/`,
                "@": path.resolve(__dirname, "./src/"),
                react: path.resolve(__dirname, "node_modules/react"),
                "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
            },
            dedupe: ["react", "react-dom"],
        },
        server: {
            proxy: {
                "/api": {
                    target: "http://localhost:81", // replace with your API server URL
                    changeOrigin: false,
                    xfwd: true,
                    rewrite: (path) => path, // optional: if you want to remove /api from the request
                },
                "/ws": {
                    target: "ws://localhost:82", // replace with your API server URL
                    changeOrigin: true,
                    rewrite: (path) => path.replace("/ws", ""), // optional: if you want to remove /api from the request
                },
            },
        },
        build: {
            sourcemap: false,
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes("node_modules")) {
                            if (
                                id.includes("pdfjs-dist") ||
                                id.includes("react-pdf")
                            )
                                return "vendor-pdf";
                            // Recharts 3 uses @reduxjs/toolkit internally. Splitting them into separate chunks
                            // makes Rollup emit a circular import (redux chunk imports React hooks from charts chunk)
                            // while charts imports RTK — ESM init then runs vg()/React shim before `K` exists →
                            // "Cannot set properties of undefined (setting 'Activity')".
                            if (
                                id.includes("recharts") ||
                                id.includes("@reduxjs/toolkit") ||
                                id.includes("react-redux")
                            ) {
                                return "vendor-recharts-redux";
                            }
                            if (id.includes("leaflet")) return "vendor-leaflet";
                            if (id.includes("@radix-ui")) return "vendor-radix";
                        }

                        return undefined;
                    },
                },
            },
        },
        esbuild: process.env.NODE_ENV === "production" ? { drop: ["console", "debugger"]} : undefined,
    };
});
