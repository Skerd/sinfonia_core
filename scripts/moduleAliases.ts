import fs from "node:fs";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const sinfoniaRoot = path.resolve(__dirname, "..");
const modulesDir = path.join(sinfoniaRoot, "src/modules");
const tsconfigPath = path.join(sinfoniaRoot, "tsconfig.json");

// Matches TS paths like @coreModule/* (package shortcuts under src/modules).
const MODULE_PATH_KEY_RE = /^@[A-Za-z0-9]+Module\/\*$/;

// Strip line and block comments so we can parse tsconfig as JSONC.
function stripJsonc(text: string) {
    let out = "";
    let i = 0;
    let inString = false;
    let stringQuote = "";
    while (i < text.length) {
        const ch = text[i];
        const next = text[i + 1];
        if (inString) {
            out += ch;
            if (ch === "\\" && i + 1 < text.length) {
                out += text[i + 1];
                i += 2;
                continue;
            }
            if (ch === stringQuote) {
                inString = false;
            }
            i += 1;
            continue;
        }
        if (ch === '"' || ch === "'") {
            inString = true;
            stringQuote = ch;
            out += ch;
            i += 1;
            continue;
        }
        if (ch === "/" && next === "/") {
            i += 2;
            while (i < text.length && text[i] !== "\n") {
                i += 1;
            }
            continue;
        }
        if (ch === "/" && next === "*") {
            i += 2;
            while (i + 1 < text.length && !(text[i] === "*" && text[i + 1] === "/")) {
                i += 1;
            }
            i += 2;
            continue;
        }
        out += ch;
        i += 1;
    }
    return out;
}

/**
 * Directory names under src/modules (sorted), excluding dotfolders.
 * Each becomes @{name}Module mapped to that directory.
 */
export function listModuleDirs() {
    if (!fs.existsSync(modulesDir)) {
        return [];
    }
    return fs
        .readdirSync(modulesDir, {withFileTypes: true})
        .filter((d) => d.isDirectory() && !d.name.startsWith("."))
        .map((d) => d.name)
        .sort((a, b) => a.localeCompare(b));
}

/** Vite / Vitest resolve.alias entries for discovered packages. */
export function buildViteModuleAliases() {
    return Object.fromEntries(
        listModuleDirs().map((name) => [
            `@${name}Module`,
            path.join(modulesDir, name),
        ]),
    );
}

/** TypeScript compilerOptions.paths entries for discovered packages. */
export function buildTsModulePaths() {
    return Object.fromEntries(
        listModuleDirs().map((name) => [
            `@${name}Module/*`,
            [`src/modules/${name}/*`],
        ]),
    );
}

/** Pretty-print tsconfig with compact single-line path arrays. */
function formatTsconfig(json: any) {
    const paths = json.compilerOptions?.paths ?? {};
    const clone = structuredClone(json);
    if (clone.compilerOptions) {
        delete clone.compilerOptions.paths;
    }
    const base = JSON.stringify(clone, null, 2);
    const pathLines = Object.entries(paths).map(
        ([key, value]) => `      ${JSON.stringify(key)}: ${JSON.stringify(value)}`,
    );
    const pathsBlock = `    "paths": {\n${pathLines.join(",\n")}\n    }`;
    // Insert paths as the last compilerOptions property.
    return base.replace(/\n  \}\n\}\n?$/, `,\n${pathsBlock}\n  }\n}\n`);
}

/**
 * Rewrite @{pkg}Module path keys in tsconfig.json from the filesystem.
 * Leaves all other paths entries untouched. Writes only when content changes.
 */
export function syncTsconfigModulePaths() {
    const modules = listModuleDirs();
    const modulePaths = buildTsModulePaths();
    const raw = fs.readFileSync(tsconfigPath, "utf8");
    const json = JSON.parse(stripJsonc(raw));
    if (!json.compilerOptions) {
        json.compilerOptions = {};
    }
    const existing = json.compilerOptions.paths ?? {};
    const staticPaths = Object.fromEntries(
        Object.entries(existing).filter(([key]) => !MODULE_PATH_KEY_RE.test(key)),
    );
    // Modules first so they stay grouped at the top of paths when written.
    const nextPaths = {...modulePaths, ...staticPaths};
    json.compilerOptions.paths = nextPaths;
    const nextText = formatTsconfig(json);
    if (raw !== nextText) {
        fs.writeFileSync(tsconfigPath, nextText);
        return {changed: true, modules};
    }
    return {changed: false, modules};
}

// CLI: node scripts/moduleAliases.mjs
const isMain =
    process.argv[1] != null &&
    import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
    const {changed, modules} = syncTsconfigModulePaths();
    console.log(
        `[moduleAliases] ${modules.map((m) => `@${m}Module`).join(", ")}${changed ? " (tsconfig updated)" : ""}`,
    );
}
