import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {afterEach, beforeEach, describe, expect, it} from "vitest";
import {
    applySourceEdits,
    applyTextEdits,
    assertWritablePath,
    printValue,
} from "./studioSourceEdits.ts";

let root: string;

function write(relative: string, contents: string) {
    const full = path.join(root, relative);
    fs.mkdirSync(path.dirname(full), {recursive: true});
    fs.writeFileSync(full, contents, "utf8");
    return full;
}

const VIEWS = `import type {ViewConfig} from "armonia/src/magic/viewConfig";
import {SHARED_PROPS} from "./constants";

export const warehouseSheetView: ViewConfig = {
    model: "warehouses",
    viewType: "sheet",
    accessModel: "warehouses",
    apiUrl: "/api/warehouse",
    nodes: [
        {
            // keep me
            render: "#SheetGroup",
            props: {title: "overview"},
            children: [
                {render: "#DisplayCard", field: {name: "name", widget: "#DisplayCard"}, dependent: "name"},
                {render: "#DisplayCard", field: {name: "code", widget: "#DisplayCard"}},
            ],
        },
        {render: "#Badge", props: SHARED_PROPS},
    ],
};
`;

const SHARED_VIEWS = `import type {ViewConfig} from "armonia/src/magic/viewConfig";

const gadgetFormFields: ViewConfig["nodes"] = [
    {render: "#Field", field: {name: "name", widget: "#Input"}},
];

export const gadgetCreateFormView: ViewConfig = {
    model: "gadgets",
    viewType: "form",
    viewMode: "create",
    accessModel: "gadgets",
    apiUrl: "/api/gadget",
    nodes: gadgetFormFields,
};

export const gadgetEditFormView: ViewConfig = {
    model: "gadgets",
    viewType: "form",
    viewMode: "edit",
    accessModel: "gadgets",
    apiUrl: "/api/gadget",
    nodes: gadgetFormFields,
};
`;

let viewsFile: string;

beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "studio-edits-"));
    write("modules/e/schemas/w/constants.ts", "export const SHARED_PROPS = {a: 1};\n");
    viewsFile = write("modules/e/schemas/w/warehouse.views.ts", VIEWS);
    write("modules/e/schemas/g/gadget.views.ts", SHARED_VIEWS);
});

afterEach(() => {
    fs.rmSync(root, {recursive: true, force: true});
});

function apply(request: Parameters<typeof applySourceEdits>[0]) {
    return applySourceEdits(request, {maestroRoot: root});
}

function readViews() {
    return fs.readFileSync(viewsFile, "utf8");
}

describe("printValue", () => {
    it("prints JSON as the source style the corpus uses", () => {
        expect(printValue("a")).toBe('"a"');
        expect(printValue(3)).toBe("3");
        expect(printValue(true)).toBe("true");
        expect(printValue(["a", "b"])).toBe('["a", "b"]');
        expect(printValue({title: "x", columns: 2})).toBe('{title: "x", columns: 2}');
    });

    it("quotes keys that are not safe identifiers", () => {
        expect(printValue({"a-b": 1})).toBe('{"a-b": 1}');
    });

    it("drops undefined members rather than emitting `undefined`", () => {
        expect(printValue({a: 1, b: undefined})).toBe("{a: 1}");
    });
});

describe("applyTextEdits", () => {
    it("applies right-to-left so earlier offsets stay valid", () => {
        expect(
            applyTextEdits("0123456789", [
                {start: 0, end: 1, text: "A"},
                {start: 5, end: 6, text: "B"},
            ]),
        ).toBe("A1234B6789");
    });

    it("refuses overlapping edits rather than corrupting the text", () => {
        expect(() =>
            applyTextEdits("0123456789", [
                {start: 0, end: 5, text: "A"},
                {start: 3, end: 8, text: "B"},
            ]),
        ).toThrow(/overlapping/i);
    });
});

describe("guard 1 — writable path", () => {
    it("accepts a views file inside maestro/modules", () => {
        expect(assertWritablePath(viewsFile, root)).toBe(fs.realpathSync(viewsFile));
    });

    it("refuses a non-views file", () => {
        const other = write("modules/e/schemas/w/warehouse.ts", "export const x = 1;");
        expect(() => assertWritablePath(other, root)).toThrow(/not a \*\.views\.ts/);
    });

    it("refuses a path outside maestro/modules", () => {
        const outside = path.join(root, "elsewhere/evil.views.ts");
        fs.mkdirSync(path.dirname(outside), {recursive: true});
        fs.writeFileSync(outside, VIEWS);
        expect(() => assertWritablePath(outside, root)).toThrow(/outside/);
    });

    it("refuses a symlink that escapes the tree", () => {
        const outside = path.join(root, "outside.views.ts");
        fs.writeFileSync(outside, VIEWS);
        const link = path.join(root, "modules/e/schemas/w/link.views.ts");
        fs.symlinkSync(outside, link);
        expect(() => assertWritablePath(link, root)).toThrow(/outside/);
    });

    it("refuses a file that does not exist", () => {
        expect(() => assertWritablePath(path.join(root, "modules/nope.views.ts"), root)).toThrow(
            /does not exist/,
        );
    });
});

describe("guard 2 — shared node arrays", () => {
    it("refuses a shared target and names every config affected", () => {
        const result = apply({
            target: "gadgets:form:create",
            edits: [{kind: "setProperty", nodePath: "0", property: "dependent", value: "x"}],
        });
        expect(result.ok).toBe(false);
        expect(result.error).toMatch(/shared by 2 configs/);
        expect([...result.sharedWith!].sort()).toEqual([
            "gadgets:form:create",
            "gadgets:form:edit",
        ]);
    });

    it("leaves the file byte-identical when it refuses", () => {
        const before = fs.readFileSync(path.join(root, "modules/e/schemas/g/gadget.views.ts"), "utf8");
        apply({
            target: "gadgets:form:create",
            edits: [{kind: "setProperty", nodePath: "0", property: "dependent", value: "x"}],
        });
        expect(fs.readFileSync(path.join(root, "modules/e/schemas/g/gadget.views.ts"), "utf8")).toBe(
            before,
        );
    });

    it("proceeds once sharing is confirmed, and still reports who was affected", () => {
        const result = apply({
            target: "gadgets:form:create",
            confirmShared: true,
            edits: [{kind: "setProperty", nodePath: "0", property: "dependent", value: "x"}],
        });
        expect(result.ok).toBe(true);
        expect(result.sharedWith).toHaveLength(2);
        expect(fs.readFileSync(path.join(root, "modules/e/schemas/g/gadget.views.ts"), "utf8")).toContain(
            'dependent: "x"',
        );
    });

    it("does not ask for confirmation on an unshared target", () => {
        const result = apply({
            target: "warehouses:sheet",
            edits: [{kind: "setProperty", nodePath: "0", property: "dependent", value: "x"}],
        });
        expect(result.ok).toBe(true);
        expect(result.sharedWith).toBeUndefined();
    });
});

describe("guard 4 — never flatten a non-literal", () => {
    it("skips a property whose value is an imported constant", () => {
        const result = apply({
            target: "warehouses:sheet",
            edits: [{kind: "setProperty", nodePath: "1", property: "props", value: {a: 2}}],
        });
        expect(result.ok).toBe(true);
        expect(result.outcomes[0]!.status).toBe("skipped");
        expect(result.outcomes[0]!.reason).toMatch(/SHARED_PROPS/);
        /* The reference survives untouched. */
        expect(readViews()).toContain("props: SHARED_PROPS");
    });
});

describe("setProperty", () => {
    it("replaces an existing literal value", () => {
        const result = apply({
            target: "warehouses:sheet",
            edits: [{kind: "setProperty", nodePath: "0", property: "props", value: {title: "renamed"}}],
        });
        expect(result.ok).toBe(true);
        expect(readViews()).toContain('props: {title: "renamed"}');
        expect(readViews()).not.toContain('title: "overview"');
    });

    it("inserts a property that was not there", () => {
        const result = apply({
            target: "warehouses:sheet",
            edits: [{kind: "setProperty", nodePath: "0.1", property: "dependent", value: "code"}],
        });
        expect(result.ok).toBe(true);
        expect(readViews()).toMatch(/name: "code".*dependent: "code"/s);
    });

    it("edits a deeply nested node without disturbing its sibling", () => {
        apply({
            target: "warehouses:sheet",
            edits: [{kind: "setProperty", nodePath: "0.0", property: "dependent", value: "changed"}],
        });
        const text = readViews();
        expect(text).toContain('dependent: "changed"');
        expect(text).toContain('{render: "#DisplayCard", field: {name: "code", widget: "#DisplayCard"}}');
    });

    it("preserves comments and untouched formatting", () => {
        apply({
            target: "warehouses:sheet",
            edits: [{kind: "setProperty", nodePath: "0", property: "props", value: {title: "x"}}],
        });
        const text = readViews();
        expect(text).toContain("// keep me");
        expect(text).toContain('import {SHARED_PROPS} from "./constants";');
        expect(text.startsWith("import type {ViewConfig}")).toBe(true);
    });

    it("applies several edits in one pass", () => {
        const result = apply({
            target: "warehouses:sheet",
            edits: [
                {kind: "setProperty", nodePath: "0.0", property: "dependent", value: "a"},
                {kind: "setProperty", nodePath: "0.1", property: "dependent", value: "b"},
            ],
        });
        expect(result.outcomes.every((o) => o.status === "applied")).toBe(true);
        expect(readViews()).toContain('dependent: "a"');
        expect(readViews()).toContain('dependent: "b"');
    });
});

describe("removeProperty", () => {
    it("removes a property and its comma", () => {
        const result = apply({
            target: "warehouses:sheet",
            edits: [{kind: "removeProperty", nodePath: "0.0", property: "dependent"}],
        });
        expect(result.ok).toBe(true);
        const text = readViews();
        expect(text).not.toContain('dependent: "name"');
        /* The edited object closes cleanly — no comma left dangling where the property was.
           Asserted on the node itself, since the file legitimately has trailing commas
           elsewhere. */
        expect(text).toContain(
            '{render: "#DisplayCard", field: {name: "name", widget: "#DisplayCard"}},',
        );
    });

    it("skips a property that is not set", () => {
        const result = apply({
            target: "warehouses:sheet",
            edits: [{kind: "removeProperty", nodePath: "0.1", property: "dependent"}],
        });
        expect(result.outcomes[0]!.status).toBe("skipped");
        expect(result.outcomes[0]!.reason).toMatch(/not set/);
    });
});

describe("skips rather than guesses", () => {
    it("skips a node path that does not exist", () => {
        const result = apply({
            target: "warehouses:sheet",
            edits: [{kind: "setProperty", nodePath: "9", property: "dependent", value: "x"}],
        });
        expect(result.outcomes[0]!.status).toBe("skipped");
        expect(result.outcomes[0]!.reason).toMatch(/not found/);
        expect(readViews()).toBe(VIEWS);
    });

    it("refuses a target whose nodes cannot be addressed", () => {
        write(
            "modules/e/schemas/s/spread.views.ts",
            `import type {ViewConfig} from "armonia/src/magic/viewConfig";
const base: ViewConfig["nodes"] = [];
export const spreadEditFormView: ViewConfig = {
    model: "spreads",
    viewType: "form",
    viewMode: "edit",
    accessModel: "spreads",
    apiUrl: "/api/spread",
    nodes: [...base, {render: "#Field", field: {name: "a", widget: "#Input"}}],
};
`,
        );
        const result = apply({
            target: "spreads:form:edit",
            edits: [{kind: "setProperty", nodePath: "0", property: "dependent", value: "x"}],
        });
        expect(result.ok).toBe(false);
        expect(result.error).toMatch(/spread/i);
    });

    it("refuses an unknown target", () => {
        const result = apply({
            target: "nope:sheet",
            edits: [{kind: "setProperty", nodePath: "0", property: "dependent", value: "x"}],
        });
        expect(result.ok).toBe(false);
        expect(result.error).toMatch(/unknown target/i);
    });
});

describe("guard 3 — the result must parse", () => {
    it("writes nothing when formatting produces invalid TypeScript", () => {
        const result = applySourceEdits(
            {
                target: "warehouses:sheet",
                edits: [{kind: "setProperty", nodePath: "0", property: "dependent", value: "x"}],
            },
            {maestroRoot: root, format: () => "const broken = {{{;"},
        );
        expect(result.ok).toBe(false);
        expect(result.error).toMatch(/invalid TypeScript/);
        expect(readViews()).toBe(VIEWS);
    });

    it("reports a formatter that throws, and writes nothing", () => {
        const result = applySourceEdits(
            {
                target: "warehouses:sheet",
                edits: [{kind: "setProperty", nodePath: "0", property: "dependent", value: "x"}],
            },
            {
                maestroRoot: root,
                format: () => {
                    throw new Error("prettier exploded");
                },
            },
        );
        expect(result.ok).toBe(false);
        expect(result.error).toMatch(/prettier exploded/);
        expect(readViews()).toBe(VIEWS);
    });
});

describe("backups — the only reliable undo here", () => {
    /* maestro's git tracks 10 of 124 views files, so `git checkout` is not an undo for
       most of the corpus. Every write must leave a recoverable copy. */

    it("writes the pre-edit contents to a backup before changing the file", () => {
        const backupDir = path.join(root, "backups");
        const result = applySourceEdits(
            {
                target: "warehouses:sheet",
                edits: [{kind: "setProperty", nodePath: "0", property: "dependent", value: "x"}],
            },
            {maestroRoot: root, backupDir},
        );
        expect(result.ok).toBe(true);
        expect(result.backupFile).toBeTruthy();
        expect(fs.readFileSync(result.backupFile!, "utf8")).toBe(VIEWS);
        expect(readViews()).not.toBe(VIEWS);
    });

    it("restores the original exactly when the backup is copied back", () => {
        const backupDir = path.join(root, "backups");
        const result = applySourceEdits(
            {
                target: "warehouses:sheet",
                edits: [{kind: "setProperty", nodePath: "0", property: "dependent", value: "x"}],
            },
            {maestroRoot: root, backupDir},
        );
        fs.copyFileSync(result.backupFile!, viewsFile);
        expect(readViews()).toBe(VIEWS);
    });

    it("preserves the file's path inside the backup tree", () => {
        const backupDir = path.join(root, "backups");
        const result = applySourceEdits(
            {
                target: "warehouses:sheet",
                edits: [{kind: "setProperty", nodePath: "0", property: "dependent", value: "x"}],
            },
            {maestroRoot: root, backupDir},
        );
        expect(result.backupFile).toContain(path.join("modules", "e", "schemas", "w"));
        expect(result.backupFile!.endsWith("warehouse.views.ts")).toBe(true);
    });

    it("takes no backup on a dry run, because nothing is written", () => {
        const result = applySourceEdits(
            {
                target: "warehouses:sheet",
                dryRun: true,
                edits: [{kind: "setProperty", nodePath: "0", property: "dependent", value: "x"}],
            },
            {maestroRoot: root, backupDir: path.join(root, "backups")},
        );
        expect(result.backupFile).toBeUndefined();
    });

    it("changes nothing if the backup cannot be written", () => {
        /* A file where the backup directory should go makes mkdir fail. */
        const blocked = path.join(root, "blocked");
        fs.writeFileSync(blocked, "not a directory");
        const result = applySourceEdits(
            {
                target: "warehouses:sheet",
                edits: [{kind: "setProperty", nodePath: "0", property: "dependent", value: "x"}],
            },
            {maestroRoot: root, backupDir: blocked},
        );
        expect(result.ok).toBe(false);
        expect(result.error).toMatch(/backup/i);
        expect(readViews()).toBe(VIEWS);
    });
});

describe("dryRun", () => {
    it("returns the new text without touching the file", () => {
        const result = apply({
            target: "warehouses:sheet",
            dryRun: true,
            edits: [{kind: "setProperty", nodePath: "0", property: "dependent", value: "x"}],
        });
        expect(result.ok).toBe(true);
        expect(result.text).toContain('dependent: "x"');
        expect(readViews()).toBe(VIEWS);
    });
});

describe("re-parse invariant", () => {
    it("every successful write leaves a file the index can still read", () => {
        apply({
            target: "warehouses:sheet",
            edits: [{kind: "setProperty", nodePath: "0", property: "props", value: {title: "z"}}],
        });
        const again = apply({
            target: "warehouses:sheet",
            edits: [{kind: "setProperty", nodePath: "0.0", property: "dependent", value: "y"}],
        });
        expect(again.ok).toBe(true);
        expect(readViews()).toContain('title: "z"');
        expect(readViews()).toContain('dependent: "y"');
    });
});
