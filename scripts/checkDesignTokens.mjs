#!/usr/bin/env node
/**
 * Guards the core panel against hardcoded colors creeping back in.
 *
 * The panel styles itself entirely from the semantic tokens in
 * src/modules/core/apps/core/index.css. A raw Tailwind palette class such as
 * `text-green-600` ignores the brand palette and does not respond to dark mode,
 * so it silently drifts away from the rest of the UI.
 *
 * Two sets of files are deliberately NOT checked:
 *  - the public and shop apps, which ship their own stylesheets and define none
 *    of these tokens, so raw palette classes are the correct choice there;
 *  - components/uiKit, a frozen read-only gallery from the shadcnuikit registry.
 *
 * Usage: node scripts/checkDesignTokens.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sinfoniaRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(sinfoniaRoot, "src");
const MODULES = path.join(SRC, "modules");

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const PREFIXES =
  "bg|text|border|ring|from|to|via|divide|shadow|fill|stroke|decoration|caret|accent|outline|placeholder";
const OFFENDER = new RegExp(`\\b(?:${PREFIXES})-(?:${PALETTE})-\\d{2,3}\\b`, "g");

const ALIASES = {
  "@coreModule": path.join(MODULES, "core"),
  "@eCommerceModule": path.join(MODULES, "eCommerce"),
  "@eCommerceMarketplaceModule": path.join(MODULES, "eCommerceMarketplace"),
  "@financeModule": path.join(MODULES, "finance"),
  "@musicIndustryModule": path.join(MODULES, "musicIndustry"),
  "@propertyManagementModule": path.join(MODULES, "propertyManagement"),
  "@swissOutreachModule": path.join(MODULES, "swissOutreach"),
  "@": SRC,
};
const EXTS = [".tsx", ".ts", ".jsx", ".js"];
const IMPORT_RE =
  /(?:import|export)\s[^'"]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|import\s*["']([^"']+)["']/g;

function resolveSpec(spec, fromFile) {
  let base;
  if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  else {
    const hit = Object.keys(ALIASES)
      .sort((a, b) => b.length - a.length)
      .find((a) => spec === a || spec.startsWith(a + "/"));
    if (!hit) return null;
    base = path.join(ALIASES[hit], spec.slice(hit.length));
  }
  const candidates = [];
  if (/\.(tsx|ts|jsx|js)$/.test(base)) {
    candidates.push(base, base.replace(/\.js$/, ".ts").replace(/\.jsx$/, ".tsx"));
  }
  for (const e of EXTS) candidates.push(base + e);
  for (const e of EXTS) candidates.push(path.join(base, "index" + e));
  for (const c of candidates) {
    try {
      if (fs.statSync(c).isFile()) return c;
    } catch {
      /* not a file */
    }
  }
  return null;
}

/** Files statically reachable from an app entry point. */
function reachableFrom(entries) {
  const seen = new Set();
  const stack = entries.filter((e) => fs.existsSync(e));
  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    let source;
    try {
      source = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const match of source.matchAll(IMPORT_RE)) {
      const spec = match[1] || match[2] || match[3];
      if (!spec) continue;
      const resolved = resolveSpec(spec, file);
      if (resolved && resolved.startsWith(SRC)) stack.push(resolved);
    }
  }
  return seen;
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "uiKit" || entry.name === "node_modules") continue;
      walk(full, acc);
    } else if (/\.(tsx|ts)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

const exempt = reachableFrom([
  path.join(MODULES, "propertyManagement/apps/public/publicEntryPoint.tsx"),
  path.join(MODULES, "eCommerce/apps/shop/shopEntryPoint.tsx"),
]);

const violations = [];
for (const file of walk(SRC)) {
  if (exempt.has(file)) continue;
  const source = fs.readFileSync(file, "utf8");
  source.split("\n").forEach((line, i) => {
    for (const match of line.matchAll(OFFENDER)) {
      violations.push({ file: path.relative(sinfoniaRoot, file), line: i + 1, text: match[0] });
    }
  });
}

if (violations.length === 0) {
  console.log("[design-tokens] ok - no hardcoded palette classes in the core panel");
  process.exit(0);
}

console.error(
  `[design-tokens] ${violations.length} hardcoded palette class(es) found.\n` +
    `Use semantic tokens instead: success | warning | info | destructive | primary |\n` +
    `muted-foreground | foreground | border | card, or the --status-* domain tokens.\n`
);
for (const v of violations) console.error(`  ${v.file}:${v.line}  ${v.text}`);
process.exit(1);
