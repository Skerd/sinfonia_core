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
import { resolveSinfoniaApp } from "./scripts/sinfoniaApps";
import { studioSourcePlugin } from "./scripts/studioSourcePlugin";
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

function sinfoniaAppHtmlPlugin(appHtmlPath: string, appId: string): Plugin {
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
 * Serve / copy each client's `apps/<id>/assets/favIcon.png` as `/favIcon.png`,
 * overriding the shared `public/favIcon.png` when the per-app file exists.
 */
function sinfoniaAppFaviconPlugin(appRoot: string, viteBase: string): Plugin {
    const faviconPath = path.join(appRoot, "assets", "favIcon.png");
    let outDir = path.resolve(__dirname, "dist");

    const isFaviconRequest = (rawUrl: string | undefined): boolean => {
        const pathname = (rawUrl ?? "").split("?")[0] ?? "";
        if (pathname === "/favIcon.png") {
            return true;
        }
        const basePath = viteBase.endsWith("/") ? viteBase.slice(0, -1) : viteBase;
        return pathname === `${basePath}/favIcon.png`;
    };

    return {
        name: "sinfonia-app-favicon",
        configResolved(config) {
            outDir = path.resolve(config.root, config.build.outDir);
        },
        configureServer(server) {
            if (!fs.existsSync(faviconPath)) {
                return;
            }
            server.middlewares.use((req, res, next) => {
                if (!isFaviconRequest(req.url)) {
                    next();
                    return;
                }
                res.setHeader("Content-Type", "image/png");
                res.setHeader("Cache-Control", "no-cache");
                fs.createReadStream(faviconPath).pipe(res);
            });
        },
        writeBundle() {
            if (!fs.existsSync(faviconPath)) {
                return;
            }
            fs.mkdirSync(outDir, {recursive: true});
            fs.copyFileSync(faviconPath, path.join(outDir, "favIcon.png"));
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
                return "{}\n";
            }
            return null;
        },
    };
}


/** Normalize deploy path to a Vite `base` (always `/` or `/segment/`). */
function normalizeViteBasePath(raw: string | undefined): string {
    const value = (raw ?? "/").trim() || "/";
    if (value === "/") {
        return "/";
    }
    const trimmed = value.replace(/^\/+|\/+$/g, "");
    return `/${trimmed}/`;
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, __dirname, "");
    const enabledModulesRaw =
        process.env.VITE_ENABLED_MODULES ?? env.VITE_ENABLED_MODULES;
    const sinfoniaApp = resolveSinfoniaApp(
        process.env.VITE_SINFONIA_APP ?? env.VITE_SINFONIA_APP,
    );
    const viteBase = normalizeViteBasePath(
        process.env.VITE_BASE_PATH ?? env.VITE_BASE_PATH,
    );
    // Scan `src/modules/*` → `@${dir}Module` aliases; keep tsconfig `paths` in sync for the IDE.
    syncTsconfigModulePaths();

    return {
        base: viteBase,
        plugins: [
            enabledModulesExcludePlugin(enabledModulesRaw),
            sinfoniaAppHtmlPlugin(sinfoniaApp.indexHtml, sinfoniaApp.appId),
            sinfoniaAppFaviconPlugin(sinfoniaApp.appRoot, viteBase),
            /* Studio only, dev server only: reads and writes maestro's `*.views.ts`. The
               plugin is `apply: "serve"`, so it cannot reach a production build. */
            studioSourcePlugin({
                maestroRoot: path.resolve(__dirname, "../maestro"),
                enabled: sinfoniaApp.appId === "studio",
            }),
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
                            if (
                                id.includes("docx-preview") ||
                                id.includes("/xlsx") ||
                                id.endsWith("xlsx")
                            )
                                return "vendor-office";
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
