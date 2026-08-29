import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import {buildSourceIndex, findProperty, type SourceIndex, type StudioTargetKey} from "./studioSourceIndex.ts";

/**
 * Applies targeted edits to a `*.views.ts`.
 *
 * This is the only code in the project that mutates source, so its posture is to refuse
 * rather than guess. Four things it will not do, each because the failure would be silent:
 *
 *  1. Write anywhere but a `.views.ts` file under `maestro/modules` — see
 *     {@link assertWritablePath}.
 *  2. Touch a node array shared by more than one config without explicit confirmation
 *     naming every config affected. 80 arrays in the corpus are shared, overwhelmingly a
 *     `form:create` / `form:edit` pair, so this is the common case rather than the exotic one.
 *  3. Leave a file that does not parse. Every write is re-parsed, and a failure restores the
 *     original bytes.
 *  4. Rewrite a property whose value is an identifier or a call into a literal. That is
 *     exactly the flattening the old export dialog warned about — `widgetProps: SOME_CONST`
 *     becoming `widgetProps: {...}` would silently detach the config from its constant.
 *
 * And it always takes a backup first. That is not belt-and-braces: maestro's git repository
 * tracks only 10 of the 124 `*.views.ts` files — `modules/eCommerce/` and
 * `modules/eCommerceMarketplace/` are untracked in their entirety — so for most of the corpus
 * `git checkout` is not an undo. {@link ApplyResult.backupFile} is the undo.
 *
 * Edits are expressed against node paths (`"1.0.2"`), the same coordinates the Studio's tree
 * and change list already use.
 */

export type SourceEdit =
    | {kind: "setProperty"; nodePath: string; property: string; value: unknown}
    | {kind: "removeProperty"; nodePath: string; property: string};

export type EditOutcome = {
    edit: SourceEdit;
    status: "applied" | "skipped";
    /** Why it was skipped. Always populated for `skipped`. */
    reason?: string;
};

export type ApplyRequest = {
    target: StudioTargetKey;
    edits: SourceEdit[];
    /** Required when the target's nodes are shared; without it a shared target is refused. */
    confirmShared?: boolean;
    /** Compute the new text but do not write it. */
    dryRun?: boolean;
};

export type ApplyResult = {
    ok: boolean;
    /** Copy of the file as it was before this write. The only reliable undo — see above. */
    backupFile?: string;
    /** Set when the whole request was refused, as opposed to individual edits skipping. */
    error?: string;
    /** Configs that share this node array; present whenever sharing was detected. */
    sharedWith?: StudioTargetKey[];
    file?: string;
    outcomes: EditOutcome[];
    /** The file text after the edits — returned on a dry run, and for tests. */
    text?: string;
};

// ---------------------------------------------------------------------------
// Guard 1 — where we are allowed to write
// ---------------------------------------------------------------------------

/**
 * Throws unless `file` is a real `*.views.ts` inside `maestroRoot/modules`.
 * Uses realpath on both sides, so a symlink pointing out of the tree cannot slip through.
 */
export function assertWritablePath(file: string, maestroRoot: string): string {
    if (!file.endsWith(".views.ts")) {
        throw new Error(`Refusing to write ${path.basename(file)}: not a *.views.ts file.`);
    }
    if (!fs.existsSync(file)) {
        throw new Error(`Refusing to write ${file}: file does not exist.`);
    }

    const realFile = fs.realpathSync(file);
    const realModules = fs.realpathSync(path.join(maestroRoot, "modules"));
    const relative = path.relative(realModules, realFile);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
        throw new Error(`Refusing to write ${realFile}: outside ${realModules}.`);
    }
    return realFile;
}

// ---------------------------------------------------------------------------
// Printing values back to source
// ---------------------------------------------------------------------------

/**
 * Prints a JSON value as TypeScript source, matching the corpus's own style: unquoted
 * identifier keys and double-quoted strings, which is what prettier will settle on anyway.
 */
export function printValue(value: unknown): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "string") return JSON.stringify(value);
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) return `[${value.map(printValue).join(", ")}]`;
    if (typeof value === "object") {
        const entries = Object.entries(value as Record<string, unknown>)
            .filter(([, v]) => v !== undefined)
            .map(([key, v]) => `${isSafeKey(key) ? key : JSON.stringify(key)}: ${printValue(v)}`);
        return `{${entries.join(", ")}}`;
    }
    throw new Error(`Cannot print value of type ${typeof value}`);
}

function isSafeKey(key: string): boolean {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key);
}

// ---------------------------------------------------------------------------
// Text edits
// ---------------------------------------------------------------------------

type TextEdit = {start: number; end: number; text: string};

/**
 * Applies edits right-to-left so that earlier offsets stay valid as later ones are replaced.
 * Overlapping edits are a programming error and throw rather than corrupt the file.
 */
export function applyTextEdits(source: string, edits: TextEdit[]): string {
    const ordered = [...edits].sort((a, b) => b.start - a.start);
    let previousStart = Number.POSITIVE_INFINITY;
    let result = source;

    for (const edit of ordered) {
        if (edit.end > previousStart) {
            throw new Error("Overlapping source edits — refusing to apply.");
        }
        result = result.slice(0, edit.start) + edit.text + result.slice(edit.end);
        previousStart = edit.start;
    }
    return result;
}

/** True when a property's current value is not a literal we may safely replace. */
function isNonLiteralValue(expression: ts.Expression): boolean {
    return (
        ts.isIdentifier(expression) ||
        ts.isCallExpression(expression) ||
        ts.isPropertyAccessExpression(expression) ||
        ts.isSpreadElement(expression as unknown as ts.Node)
    );
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

export type ApplyOptions = {
    maestroRoot: string;
    /** Injected so a caller can reuse a warm index; rebuilt per call otherwise. */
    index?: SourceIndex;
    /**
     * Optional formatter for the edited text.
     *
     * The dev-server plugin deliberately passes none: maestro has no prettier config and its
     * views files do not satisfy prettier's defaults, so formatting one would rewrite the
     * entire file and bury a one-property change. Kept as an injection point for tests that
     * need to exercise the "formatting failed" path.
     */
    format?: (text: string, filepath: string) => string;
    /**
     * Where pre-write copies go. Defaults to `.studio-backups/` beside maestro, outside the
     * source tree so a backup can never be mistaken for a module file.
     */
    backupDir?: string;
};

/** Copies `file` into a timestamped backup tree, preserving its path. */
function writeBackup(file: string, contents: string, maestroRoot: string, backupDir?: string): string {
    /* `file` has been through realpath, so the root must be too — otherwise a symlink
       anywhere above it (on macOS, `/var` → `/private/var`) makes this relative path
       escape the root and the backup lands somewhere unwritable. */
    const realRoot = fs.realpathSync(maestroRoot);
    const root = backupDir ?? path.join(realRoot, "..", ".studio-backups");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const relative = path.relative(realRoot, file);
    const destination = path.join(root, stamp, relative);
    fs.mkdirSync(path.dirname(destination), {recursive: true});
    fs.writeFileSync(destination, contents, "utf8");
    return destination;
}

export function applySourceEdits(request: ApplyRequest, options: ApplyOptions): ApplyResult {
    const {maestroRoot} = options;
    /* Always re-resolve against fresh source: a cached index's offsets go stale the moment
       anything else touches the file. */
    const index = options.index ?? buildSourceIndex(maestroRoot);

    const entry = index.byTarget.get(request.target);
    if (!entry) {
        return {ok: false, error: `Unknown target ${request.target}.`, outcomes: []};
    }
    if (!entry.addressable) {
        return {
            ok: false,
            error: entry.unaddressableReason ?? "This config's nodes cannot be addressed positionally.",
            outcomes: [],
        };
    }

    // -- Guard 2: sharing -------------------------------------------------
    const sharedGroup = index.sharedGroups.find((group) => group.includes(request.target));
    if (sharedGroup && !request.confirmShared) {
        return {
            ok: false,
            error:
                `\`${entry.nodesIdentifier ?? "nodes"}\` is shared by ${sharedGroup.length} configs. ` +
                "Editing it changes all of them; re-send with confirmShared to proceed.",
            sharedWith: sharedGroup,
            outcomes: [],
        };
    }

    let file: string;
    try {
        // -- Guard 1: path ------------------------------------------------
        file = assertWritablePath(entry.nodesFile, maestroRoot);
    } catch (error) {
        return {ok: false, error: (error as Error).message, outcomes: []};
    }

    const original = fs.readFileSync(file, "utf8");
    const sourceFile = ts.createSourceFile(file, original, ts.ScriptTarget.Latest, true);

    const outcomes: EditOutcome[] = [];
    const textEdits: TextEdit[] = [];

    for (const edit of request.edits) {
        const ref = index.resolve(request.target, edit.nodePath);
        if (!ref) {
            outcomes.push({edit, status: "skipped", reason: `nodes[${edit.nodePath}] not found.`});
            continue;
        }
        if (fs.realpathSync(ref.file) !== file) {
            /* The node lives in another file — typically an imported shared fragment. */
            outcomes.push({
                edit,
                status: "skipped",
                reason: `nodes[${edit.nodePath}] is declared in ${path.basename(ref.file)}, not this file.`,
            });
            continue;
        }

        const objectNode = findObjectLiteralAt(sourceFile, ref.start);
        if (!objectNode) {
            outcomes.push({
                edit,
                status: "skipped",
                reason: `nodes[${edit.nodePath}] is not an object literal in source.`,
            });
            continue;
        }

        const existing = findProperty(objectNode, edit.property);

        if (edit.kind === "removeProperty") {
            if (!existing) {
                outcomes.push({edit, status: "skipped", reason: `\`${edit.property}\` is not set.`});
                continue;
            }
            textEdits.push(removalEdit(original, objectNode, existing));
            outcomes.push({edit, status: "applied"});
            continue;
        }

        if (existing) {
            // -- Guard 4: never flatten a non-literal ----------------------
            if (isNonLiteralValue(existing.initializer)) {
                outcomes.push({
                    edit,
                    status: "skipped",
                    reason:
                        `\`${edit.property}\` is \`${existing.initializer.getText(sourceFile)}\`, ` +
                        "not a literal — rewriting it would detach the config from that reference.",
                });
                continue;
            }
            textEdits.push({
                start: existing.initializer.getStart(sourceFile),
                end: existing.initializer.getEnd(),
                text: printValue(edit.value),
            });
        } else {
            textEdits.push(insertionEdit(objectNode, edit.property, edit.value, sourceFile));
        }
        outcomes.push({edit, status: "applied"});
    }

    if (textEdits.length === 0) {
        return {ok: true, file, outcomes, text: original, sharedWith: sharedGroup};
    }

    let updated: string;
    try {
        updated = applyTextEdits(original, textEdits);
    } catch (error) {
        return {ok: false, error: (error as Error).message, file, outcomes: []};
    }

    if (options.format) {
        try {
            updated = options.format(updated, file);
        } catch (error) {
            return {
                ok: false,
                error: `Formatting failed, nothing written: ${(error as Error).message}`,
                file,
                outcomes,
            };
        }
    }

    // -- Guard 3: it must still parse -------------------------------------
    const syntaxError = firstSyntaxError(file, updated);
    if (syntaxError) {
        return {
            ok: false,
            error: `Edit produced invalid TypeScript (${syntaxError}); the file was left untouched.`,
            file,
            outcomes,
        };
    }

    let backupFile: string | undefined;
    if (!request.dryRun) {
        /* Backup before the write, never after — a crash between the two must still leave
           the original recoverable. */
        try {
            backupFile = writeBackup(file, original, maestroRoot, options.backupDir);
        } catch (error) {
            return {
                ok: false,
                error: `Could not write a backup, so nothing was changed: ${(error as Error).message}`,
                file,
                outcomes,
            };
        }
        fs.writeFileSync(file, updated, "utf8");
    }

    return {ok: true, file, backupFile, outcomes, text: updated, sharedWith: sharedGroup};
}

/** The object literal starting exactly at `position`. */
function findObjectLiteralAt(
    sourceFile: ts.SourceFile,
    position: number,
): ts.ObjectLiteralExpression | null {
    let found: ts.ObjectLiteralExpression | null = null;
    const visit = (node: ts.Node) => {
        if (found) return;
        if (ts.isObjectLiteralExpression(node) && node.getStart(sourceFile) === position) {
            found = node;
            return;
        }
        if (position >= node.getStart(sourceFile) && position <= node.getEnd()) {
            ts.forEachChild(node, visit);
        }
    };
    ts.forEachChild(sourceFile, visit);
    return found;
}

/** Removes a property and the comma that separated it, leaving no dangling punctuation. */
function removalEdit(
    source: string,
    object: ts.ObjectLiteralExpression,
    property: ts.PropertyAssignment,
): TextEdit {
    let start = property.getFullStart();
    let end = property.getEnd();

    /* Consume a trailing comma; otherwise consume a preceding one for the last property. */
    let cursor = end;
    while (cursor < source.length && /\s/.test(source[cursor]!)) cursor++;
    if (source[cursor] === ",") {
        end = cursor + 1;
    } else {
        let back = start - 1;
        while (back >= 0 && /\s/.test(source[back]!)) back--;
        if (source[back] === ",") start = back;
    }
    void object;
    return {start, end, text: ""};
}

/** Inserts a new property just before the object's closing brace. */
function insertionEdit(
    object: ts.ObjectLiteralExpression,
    property: string,
    value: unknown,
    sourceFile: ts.SourceFile,
): TextEdit {
    const printed = `${isSafeKey(property) ? property : JSON.stringify(property)}: ${printValue(value)}`;
    const last = object.properties[object.properties.length - 1];

    if (!last) {
        /* Empty object: place it between the braces. */
        const open = object.getStart(sourceFile) + 1;
        return {start: open, end: open, text: printed};
    }
    const end = last.getEnd();
    return {start: end, end, text: `, ${printed}`};
}

function firstSyntaxError(file: string, text: string): string | null {
    const parsed = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    /* `parseDiagnostics` is internal but is the only way to see syntax errors without a
       full Program; absence of the field must not be read as "no errors". */
    const diagnostics = (parsed as unknown as {parseDiagnostics?: ts.Diagnostic[]}).parseDiagnostics;
    if (!diagnostics) return null;
    const first = diagnostics[0];
    if (!first) return null;
    return ts.flattenDiagnosticMessageText(first.messageText, " ");
}
