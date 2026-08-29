import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

/**
 * Maps a served `ViewConfig` back to the `*.views.ts` that declares it, and a node path
 * inside that config back to a range in the file.
 *
 * The Studio edits the API payload, which is the *materialised* result of these files. That
 * payload cannot say where a node came from, which is why every edit has ended in manual
 * transcription. This index is the missing link.
 *
 * Parsed with the TypeScript AST rather than matched with a regex, for a concrete reason: a
 * regex probe over the corpus could not even delimit 68 of the declarations, purely on nested
 * braces, and undercounted the shared arrays below by half. Nothing that decides where to
 * *write* can be built on that.
 *
 * Measured over the real corpus (124 files, 327 `ViewConfig` declarations):
 *  - `nodes: [ … ]` — an array literal, addressed by element index.
 *  - `nodes: someIdentifier` — the whole array is a module-level const. **Two configs
 *    routinely share one**: `xCreateFormView` and `xEditFormView` both point at
 *    `xFormFields`, so an edit to one is an edit to both. **80 arrays are shared this way**,
 *    which is why every writer above this must confirm before touching one.
 *  - An element that is an identifier (`lifecycleSheetGroup`), resolved here across files
 *    through the `@coreModule/*` style aliases maestro declares in its tsconfig.
 *  - A spread or a call in a node position (10 targets, all `form:edit`). Deliberately
 *    reported as **unaddressable** rather than guessed at — see
 *    {@link TargetEntry.addressable}.
 */

/** `${model}:${viewKey}` — the same key `viewConfigKey()` builds on the client. */
export type StudioTargetKey = string;

export type SharedRef = {
    /** The identifier the path passed through, e.g. `warehouseFormFields`. */
    name: string;
    file: string;
    /** Every config resolving to this same array — always includes the one asked about. */
    usedBy: StudioTargetKey[];
};

export type SourceNodeRef = {
    file: string;
    start: number;
    end: number;
    /** 1-based, for editor links. */
    line: number;
    column: number;
    /** Set when reaching this node went through a shared identifier. */
    sharedVia?: SharedRef;
};

export type TargetEntry = {
    key: StudioTargetKey;
    model: string;
    viewKey: string;
    /** File declaring the `ViewConfig`. */
    file: string;
    declName: string;
    /** File holding the `nodes` array — another file when `nodes` is an imported const. */
    nodesFile: string;
    /** Set when `nodes` is an identifier rather than an inline array literal. */
    nodesIdentifier?: string;
    /**
     * Top-level elements in the node array. Zero is legitimate — `cart.views.ts` declares
     * `nodes: []` — and maestro drops such a config rather than serving it, so the Studio
     * shows it as an empty source view rather than pretending a node path exists.
     */
    nodeCount: number;
    /**
     * False when the node array contains a spread or call and positional addressing would
     * be a guess. Such a target is readable but never writable.
     */
    addressable: boolean;
    /** Why it is not addressable, for the UI to relay verbatim. */
    unaddressableReason?: string;
};

export type SourceIndex = {
    byTarget: Map<StudioTargetKey, TargetEntry>;
    /** Groups of targets whose `nodes` resolve to the same array literal. Length >= 2. */
    sharedGroups: StudioTargetKey[][];
    resolve(key: StudioTargetKey, nodePath: string): SourceNodeRef | null;
    /** Files parsed, so a watcher knows what invalidates the index. */
    files: string[];
};

type ParsedFile = {
    file: string;
    source: ts.SourceFile;
    /** Module-scope `const` initializers, by name. */
    declarations: Map<string, ts.Expression>;
    /** Imported name → module specifier. */
    imports: Map<string, string>;
};

// ---------------------------------------------------------------------------
// Module resolution
// ---------------------------------------------------------------------------

/** maestro's tsconfig `paths`, which is how shared fragments are imported. */
const MAESTRO_ALIASES: Record<string, string> = {
    "@coreModule/": "modules/core/",
    "@realEstateModule/": "modules/realEstate/",
    "@propertyManagement/": "modules/propertyManagement/",
    "@musicIndustry/": "modules/musicIndustry/",
    "@eCommerceModule/": "modules/eCommerce/",
    "@eCommerceMarketplaceModule/": "modules/eCommerceMarketplace/",
    "@financeModule/": "modules/finance/",
    "@swissOutreachModule/": "modules/swissOutreach/",
};

/** Resolves an import specifier to a file on disk, or null when it leaves maestro. */
export function resolveSpecifier(
    specifier: string,
    fromFile: string,
    maestroRoot: string,
): string | null {
    let base: string | null = null;

    if (specifier.startsWith(".")) {
        base = path.resolve(path.dirname(fromFile), specifier);
    } else {
        for (const [alias, target] of Object.entries(MAESTRO_ALIASES)) {
            if (specifier.startsWith(alias)) {
                base = path.join(maestroRoot, target, specifier.slice(alias.length));
                break;
            }
        }
    }
    if (!base) return null;

    for (const candidate of [base, `${base}.ts`, path.join(base, "index.ts")]) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    }
    return null;
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

function parseFile(file: string): ParsedFile {
    const text = fs.readFileSync(file, "utf8");
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);

    const declarations = new Map<string, ts.Expression>();
    const imports = new Map<string, string>();

    for (const statement of source.statements) {
        if (ts.isVariableStatement(statement)) {
            for (const decl of statement.declarationList.declarations) {
                if (ts.isIdentifier(decl.name) && decl.initializer) {
                    declarations.set(decl.name.text, decl.initializer);
                }
            }
            continue;
        }
        if (
            ts.isImportDeclaration(statement) &&
            ts.isStringLiteral(statement.moduleSpecifier) &&
            statement.importClause?.namedBindings &&
            ts.isNamedImports(statement.importClause.namedBindings)
        ) {
            for (const element of statement.importClause.namedBindings.elements) {
                /* `import {a as b}` — key by the local name, which is what a node body uses. */
                imports.set(element.name.text, statement.moduleSpecifier.text);
            }
        }
    }

    return {file, source, declarations, imports};
}

function stringProperty(object: ts.ObjectLiteralExpression, name: string): string | undefined {
    for (const property of object.properties) {
        if (
            ts.isPropertyAssignment(property) &&
            ts.isIdentifier(property.name) &&
            property.name.text === name &&
            ts.isStringLiteral(property.initializer)
        ) {
            return property.initializer.text;
        }
    }
    return undefined;
}

export function findProperty(
    object: ts.ObjectLiteralExpression,
    name: string,
): ts.PropertyAssignment | undefined {
    for (const property of object.properties) {
        if (
            ts.isPropertyAssignment(property) &&
            (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
            property.name.text === name
        ) {
            return property;
        }
    }
    return undefined;
}

/** True when the declaration is annotated `: ViewConfig`, our marker for a view config. */
function isViewConfigDeclaration(decl: ts.VariableDeclaration): boolean {
    const type = decl.type;
    if (!type) return false;
    return ts.isTypeReferenceNode(type) && type.getText().replace(/\s/g, "") === "ViewConfig";
}

// ---------------------------------------------------------------------------
// Index construction
// ---------------------------------------------------------------------------

export function listViewFiles(maestroRoot: string): string[] {
    const results: string[] = [];
    const walk = (dir: string) => {
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(dir, {withFileTypes: true});
        } catch {
            return;
        }
        for (const entry of entries) {
            if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (entry.name.endsWith(".views.ts")) results.push(full);
        }
    };
    walk(path.join(maestroRoot, "modules"));
    return results.sort();
}

/** Mirrors `viewConfigKey()` from the shared contract. */
function viewKeyOf(viewType: string, viewMode: string | undefined): string {
    return viewMode ? `${viewType}:${viewMode}` : viewType;
}

export function buildSourceIndex(maestroRoot: string): SourceIndex {
    const files = listViewFiles(maestroRoot);
    const parsed = new Map<string, ParsedFile>();

    const load = (file: string): ParsedFile => {
        let entry = parsed.get(file);
        if (!entry) {
            entry = parseFile(file);
            parsed.set(file, entry);
        }
        return entry;
    };

    /**
     * Follows identifiers to the expression they name, across files when the identifier is
     * imported. Returns the expression plus where it was found, so a caller can report the
     * fragment a node really lives in.
     */
    const deref = (
        expression: ts.Expression,
        owner: ParsedFile,
    ): {expression: ts.Expression; owner: ParsedFile; identifier?: string} => {
        let current = expression;
        let currentOwner = owner;
        let identifier: string | undefined;

        /* Bounded: a cycle in const declarations would not compile, but never loop on user input. */
        for (let hops = 0; hops < 8; hops++) {
            if (!ts.isIdentifier(current)) break;
            const name = current.text;
            identifier = identifier ?? name;

            const local = currentOwner.declarations.get(name);
            if (local) {
                current = local;
                continue;
            }
            const specifier = currentOwner.imports.get(name);
            if (!specifier) break;
            const target = resolveSpecifier(specifier, currentOwner.file, maestroRoot);
            if (!target) break;
            const targetFile = load(target);
            const imported = targetFile.declarations.get(name);
            if (!imported) break;
            current = imported;
            currentOwner = targetFile;
        }

        return {expression: current, owner: currentOwner, identifier};
    };

    const byTarget = new Map<StudioTargetKey, TargetEntry>();
    /** `${file}#${start}` of the resolved array literal → targets sharing it. */
    const arrayOwners = new Map<string, StudioTargetKey[]>();
    const nodesArrayByTarget = new Map<StudioTargetKey, {file: string; start: number}>();

    for (const file of files) {
        const parsedFile = load(file);

        for (const statement of parsedFile.source.statements) {
            if (!ts.isVariableStatement(statement)) continue;

            for (const decl of statement.declarationList.declarations) {
                if (!isViewConfigDeclaration(decl)) continue;
                if (!decl.initializer || !ts.isObjectLiteralExpression(decl.initializer)) continue;

                const object = decl.initializer;
                const model = stringProperty(object, "model");
                const viewType = stringProperty(object, "viewType");
                if (!model || !viewType) continue;
                const viewMode = stringProperty(object, "viewMode");
                const key = `${model.toLowerCase()}:${viewKeyOf(viewType, viewMode)}`;

                const nodesProperty = findProperty(object, "nodes");
                if (!nodesProperty) continue;

                const resolved = deref(nodesProperty.initializer, parsedFile);
                const isArray = ts.isArrayLiteralExpression(resolved.expression);

                const entry: TargetEntry = {
                    key,
                    model: model.toLowerCase(),
                    viewKey: viewKeyOf(viewType, viewMode),
                    file,
                    declName: ts.isIdentifier(decl.name) ? decl.name.text : "(anonymous)",
                    nodesFile: resolved.owner.file,
                    nodesIdentifier: ts.isIdentifier(nodesProperty.initializer)
                        ? nodesProperty.initializer.text
                        : undefined,
                    nodeCount: 0,
                    addressable: isArray,
                    unaddressableReason: isArray
                        ? undefined
                        : `\`nodes\` resolves to a ${ts.SyntaxKind[resolved.expression.kind]}, not an array literal.`,
                };

                if (isArray) {
                    const array = resolved.expression as ts.ArrayLiteralExpression;
                    entry.nodeCount = array.elements.length;
                    /* A spread anywhere means element index no longer equals node index. */
                    const spread = array.elements.find(ts.isSpreadElement);
                    if (spread) {
                        entry.addressable = false;
                        entry.unaddressableReason =
                            "`nodes` contains a spread, so element positions do not line up with node paths.";
                    }
                    const identity = `${resolved.owner.file}#${array.getStart()}`;
                    nodesArrayByTarget.set(key, {
                        file: resolved.owner.file,
                        start: array.getStart(),
                    });
                    const owners = arrayOwners.get(identity);
                    if (owners) owners.push(key);
                    else arrayOwners.set(identity, [key]);
                }

                byTarget.set(key, entry);
            }
        }
    }

    const sharedGroups = [...arrayOwners.values()].filter((group) => group.length > 1);

    /** Targets sharing the array a given target uses. */
    const sharersOf = (key: StudioTargetKey): StudioTargetKey[] => {
        const identity = nodesArrayByTarget.get(key);
        if (!identity) return [key];
        return arrayOwners.get(`${identity.file}#${identity.start}`) ?? [key];
    };

    const resolve = (key: StudioTargetKey, nodePath: string): SourceNodeRef | null => {
        const entry = byTarget.get(key);
        if (!entry) return null;

        const owner = load(entry.file);
        const configDecl = findConfigDeclaration(owner, entry.declName);
        if (!configDecl) return null;
        const nodesProperty = findProperty(configDecl, "nodes");
        if (!nodesProperty) return null;

        const current = deref(nodesProperty.initializer, owner);
        let sharedVia: SharedRef | undefined;

        /* The whole array being a named const is itself sharing — the create/edit pattern. */
        if (current.identifier) {
            const usedBy = sharersOf(key);
            if (usedBy.length > 1) {
                sharedVia = {name: current.identifier, file: current.owner.file, usedBy};
            }
        }

        const segments = nodePath === "" ? [] : nodePath.split(".").map(Number);
        let container: ts.Expression = current.expression;
        let containerOwner = current.owner;
        let target: ts.Expression | null = null;

        for (let depth = 0; depth < segments.length; depth++) {
            if (!ts.isArrayLiteralExpression(container)) return null;
            const element = container.elements[segments[depth]!];
            if (!element) return null;

            const derefed = deref(element, containerOwner);
            /* An element that names a shared fragment: report it, it is where edits land. */
            if (derefed.identifier && ts.isIdentifier(element)) {
                sharedVia = {
                    name: derefed.identifier,
                    file: derefed.owner.file,
                    usedBy: sharersOf(key),
                };
            }
            target = derefed.expression;
            containerOwner = derefed.owner;

            if (depth < segments.length - 1) {
                if (!ts.isObjectLiteralExpression(target)) return null;
                const children = findProperty(target, "children");
                if (!children) return null;
                const childArray = deref(children.initializer, containerOwner);
                container = childArray.expression;
                containerOwner = childArray.owner;
            }
        }

        const node = target ?? current.expression;
        const sourceFile = containerOwner.source;
        const start = node.getStart(sourceFile);
        const position = sourceFile.getLineAndCharacterOfPosition(start);

        return {
            file: containerOwner.file,
            start,
            end: node.getEnd(),
            line: position.line + 1,
            column: position.character + 1,
            sharedVia,
        };
    };

    return {byTarget, sharedGroups, resolve, files};
}

function findConfigDeclaration(
    parsedFile: ParsedFile,
    declName: string,
): ts.ObjectLiteralExpression | null {
    const initializer = parsedFile.declarations.get(declName);
    if (initializer && ts.isObjectLiteralExpression(initializer)) return initializer;
    return null;
}
