import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {afterEach, beforeEach, describe, expect, it} from "vitest";
import {buildSourceIndex, listViewFiles, resolveSpecifier} from "./studioSourceIndex.ts";

/**
 * Fixtures mirror the four shapes the real corpus actually uses. Each is written to a
 * throwaway maestro-shaped tree so the index exercises real file resolution, including the
 * `@coreModule/*` alias that shared fragments are imported through.
 */

let root: string;

function write(relative: string, contents: string) {
    const full = path.join(root, relative);
    fs.mkdirSync(path.dirname(full), {recursive: true});
    fs.writeFileSync(full, contents, "utf8");
    return full;
}

beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "studio-index-"));
});

afterEach(() => {
    fs.rmSync(root, {recursive: true, force: true});
});

const SHARED_FRAGMENT = `
import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";

export const lifecycleSheetGroup: ViewNode = {
    render: "#SheetGroup",
    props: {title: "lifecycle"},
    children: [
        {render: "#DisplayCard", field: {name: "createdAt", widget: "#DisplayCard"}},
    ],
};
`;

/** A literal `nodes: [...]`, the simplest and most addressable shape. */
const LITERAL_VIEWS = `
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {lifecycleSheetGroup} from "@coreModule/database/schemas/shared/lifecycleSheetGroup";

export const warehouseSheetView: ViewConfig = {
    model: "warehouses",
    viewType: "sheet",
    accessModel: "warehouses",
    apiUrl: "/api/warehouse",
    nodes: [
        {
            render: "#SheetGroup",
            props: {title: "overview"},
            children: [
                {render: "#DisplayCard", field: {name: "name", widget: "#DisplayCard"}},
                {render: "#DisplayCard", field: {name: "code", widget: "#DisplayCard"}},
            ],
        },
        lifecycleSheetGroup,
    ],
};
`;

/** The create/edit pair sharing one array — the dominant form pattern. */
const SHARED_VIEWS = `
import type {ViewConfig} from "armonia/src/magic/viewConfig";

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

/** A spread, which breaks positional addressing. */
const SPREAD_VIEWS = `
import type {ViewConfig} from "armonia/src/magic/viewConfig";

const baseFields: ViewConfig["nodes"] = [{render: "#Field", field: {name: "a", widget: "#Input"}}];

export const widgetEditFormView: ViewConfig = {
    model: "widgets",
    viewType: "form",
    viewMode: "edit",
    accessModel: "widgets",
    apiUrl: "/api/widget",
    nodes: [...baseFields, {render: "#Field", field: {name: "b", widget: "#Input"}}],
};
`;

/** A call expression, which we cannot address either. */
const CALL_VIEWS = `
import type {ViewConfig} from "armonia/src/magic/viewConfig";

function buildNodes(): ViewConfig["nodes"] { return []; }

export const thingEditFormView: ViewConfig = {
    model: "things",
    viewType: "form",
    viewMode: "edit",
    accessModel: "things",
    apiUrl: "/api/thing",
    nodes: buildNodes(),
};
`;

function seedAll() {
    write("modules/core/database/schemas/shared/lifecycleSheetGroup.ts", SHARED_FRAGMENT);
    write("modules/eCommerce/database/schemas/warehouse/warehouse.views.ts", LITERAL_VIEWS);
    write("modules/eCommerce/database/schemas/gadget/gadget.views.ts", SHARED_VIEWS);
    write("modules/eCommerce/database/schemas/widget/widget.views.ts", SPREAD_VIEWS);
    write("modules/eCommerce/database/schemas/thing/thing.views.ts", CALL_VIEWS);
}

describe("listViewFiles", () => {
    it("finds only *.views.ts, skipping node_modules and dotfiles", () => {
        seedAll();
        write("modules/eCommerce/node_modules/pkg/evil.views.ts", "export const x = 1;");
        write("modules/eCommerce/database/schemas/warehouse/warehouse.ts", "export const y = 1;");
        const files = listViewFiles(root).map((f) => path.basename(f));
        expect(files).toEqual([
            "gadget.views.ts",
            "thing.views.ts",
            "warehouse.views.ts",
            "widget.views.ts",
        ]);
    });
});

describe("resolveSpecifier", () => {
    it("resolves the @coreModule alias maestro declares", () => {
        const target = write("modules/core/database/schemas/shared/lifecycleSheetGroup.ts", "");
        expect(
            resolveSpecifier(
                "@coreModule/database/schemas/shared/lifecycleSheetGroup",
                path.join(root, "modules/eCommerce/x/y.views.ts"),
                root,
            ),
        ).toBe(target);
    });

    it("resolves a relative import", () => {
        const target = write("modules/a/shared.ts", "");
        expect(resolveSpecifier("./shared", path.join(root, "modules/a/x.views.ts"), root)).toBe(
            target,
        );
    });

    it("returns null for a package import that leaves maestro", () => {
        expect(
            resolveSpecifier("armonia/src/magic", path.join(root, "modules/a/x.views.ts"), root),
        ).toBeNull();
    });
});

describe("buildSourceIndex — target discovery", () => {
    beforeEach(seedAll);

    it("keys targets exactly as viewConfigKey does", () => {
        const index = buildSourceIndex(root);
        expect([...index.byTarget.keys()].sort()).toEqual([
            "gadgets:form:create",
            "gadgets:form:edit",
            "things:form:edit",
            "warehouses:sheet",
            "widgets:form:edit",
        ]);
    });

    it("records the declaration and the file the nodes live in", () => {
        const index = buildSourceIndex(root);
        const sheet = index.byTarget.get("warehouses:sheet")!;
        expect(sheet.declName).toBe("warehouseSheetView");
        expect(path.basename(sheet.file)).toBe("warehouse.views.ts");
        expect(sheet.nodesIdentifier).toBeUndefined();
        expect(sheet.addressable).toBe(true);
        expect(sheet.nodeCount).toBe(2);
    });

    it("records the identifier when the whole array is a named const", () => {
        const index = buildSourceIndex(root);
        const create = index.byTarget.get("gadgets:form:create")!;
        expect(create.nodesIdentifier).toBe("gadgetFormFields");
        expect(create.addressable).toBe(true);
    });
});

describe("buildSourceIndex — sharing", () => {
    beforeEach(seedAll);

    it("groups the create/edit pair that shares one array", () => {
        const index = buildSourceIndex(root);
        expect(index.sharedGroups).toHaveLength(1);
        expect([...index.sharedGroups[0]!].sort()).toEqual([
            "gadgets:form:create",
            "gadgets:form:edit",
        ]);
    });

    it("reports the sharing on every node resolved through that array", () => {
        const index = buildSourceIndex(root);
        const ref = index.resolve("gadgets:form:create", "0")!;
        expect(ref.sharedVia?.name).toBe("gadgetFormFields");
        expect([...ref.sharedVia!.usedBy].sort()).toEqual([
            "gadgets:form:create",
            "gadgets:form:edit",
        ]);
    });

    it("does not claim sharing for a config with its own literal array", () => {
        const index = buildSourceIndex(root);
        expect(index.resolve("warehouses:sheet", "0")!.sharedVia).toBeUndefined();
    });

    it("reports an element that is an imported fragment, and where it lives", () => {
        const index = buildSourceIndex(root);
        const ref = index.resolve("warehouses:sheet", "1")!;
        expect(ref.sharedVia?.name).toBe("lifecycleSheetGroup");
        expect(path.basename(ref.sharedVia!.file)).toBe("lifecycleSheetGroup.ts");
        /* Resolving lands in the fragment's own file, not the view file. */
        expect(path.basename(ref.file)).toBe("lifecycleSheetGroup.ts");
    });
});

describe("buildSourceIndex — unaddressable shapes", () => {
    beforeEach(seedAll);

    it("refuses to address a nodes array containing a spread", () => {
        const entry = buildSourceIndex(root).byTarget.get("widgets:form:edit")!;
        expect(entry.addressable).toBe(false);
        expect(entry.unaddressableReason).toMatch(/spread/i);
    });

    it("refuses to address a nodes value that is a call", () => {
        const entry = buildSourceIndex(root).byTarget.get("things:form:edit")!;
        expect(entry.addressable).toBe(false);
        expect(entry.unaddressableReason).toMatch(/CallExpression/);
    });

    it("never places an unaddressable target in a shared group", () => {
        const index = buildSourceIndex(root);
        const unaddressable = [...index.byTarget.values()]
            .filter((e) => !e.addressable)
            .map((e) => e.key);
        for (const group of index.sharedGroups) {
            for (const key of group) expect(unaddressable).not.toContain(key);
        }
    });
});

describe("resolve — node paths to source ranges", () => {
    beforeEach(seedAll);

    it("walks nested children and lands on the right node", () => {
        const index = buildSourceIndex(root);
        const source = fs.readFileSync(
            path.join(root, "modules/eCommerce/database/schemas/warehouse/warehouse.views.ts"),
            "utf8",
        );

        const group = index.resolve("warehouses:sheet", "0")!;
        expect(source.slice(group.start, group.end)).toContain('render: "#SheetGroup"');

        const card = index.resolve("warehouses:sheet", "0.0")!;
        expect(source.slice(card.start, card.end)).toContain('name: "name"');

        const second = index.resolve("warehouses:sheet", "0.1")!;
        expect(source.slice(second.start, second.end)).toContain('name: "code"');
    });

    it("reports 1-based line and column, for editor links", () => {
        const index = buildSourceIndex(root);
        const ref = index.resolve("warehouses:sheet", "0.0")!;
        const line = fs.readFileSync(ref.file, "utf8").split("\n")[ref.line - 1]!;
        expect(line).toContain('name: "name"');
        expect(ref.line).toBeGreaterThan(0);
        expect(ref.column).toBeGreaterThan(0);
    });

    it("returns null rather than guessing for an out-of-range path", () => {
        const index = buildSourceIndex(root);
        expect(index.resolve("warehouses:sheet", "9")).toBeNull();
        expect(index.resolve("warehouses:sheet", "0.9")).toBeNull();
    });

    it("returns null for an unknown target", () => {
        expect(buildSourceIndex(root).resolve("nope:sheet", "0")).toBeNull();
    });

    it("returns null when descending into a node that has no children", () => {
        const index = buildSourceIndex(root);
        expect(index.resolve("warehouses:sheet", "0.0.0")).toBeNull();
    });
});

/**
 * The corpus is the real test. Assertions stay invariant-shaped rather than pinned to
 * counts, so legitimately editing a view file never breaks this.
 */
describe("against the real maestro corpus", () => {
    const maestroRoot = path.resolve(__dirname, "../../maestro");
    const available = fs.existsSync(path.join(maestroRoot, "modules"));

    it.runIf(available)("indexes every view file and resolves each target's first node", () => {
        const index = buildSourceIndex(maestroRoot);

        expect(index.files.length).toBeGreaterThan(100);
        expect(index.byTarget.size).toBeGreaterThan(300);

        for (const entry of index.byTarget.values()) {
            if (!entry.addressable) {
                /* Must say why — the UI shows this instead of an edit affordance. */
                expect(entry.unaddressableReason, entry.key).toBeTruthy();
                continue;
            }
            /* `nodes: []` is legitimate (cart.views.ts), and has no node 0 to resolve. */
            if (entry.nodeCount === 0) {
                expect(index.resolve(entry.key, "0"), entry.key).toBeNull();
                continue;
            }
            const ref = index.resolve(entry.key, "0");
            expect(ref, entry.key).not.toBeNull();
            expect(ref!.line, entry.key).toBeGreaterThan(0);
            expect(fs.existsSync(ref!.file), entry.key).toBe(true);
        }
    });

    it.runIf(available)("finds the create/edit sharing the corpus is full of", () => {
        const index = buildSourceIndex(maestroRoot);
        expect(index.sharedGroups.length).toBeGreaterThan(40);

        /* Nearly all of it is one form array behind both create and edit. */
        const createEditPairs = index.sharedGroups.filter(
            (group) =>
                group.some((key) => key.endsWith(":form:create")) &&
                group.some((key) => key.endsWith(":form:edit")),
        );
        expect(createEditPairs.length).toBeGreaterThan(30);
    });

    it.runIf(available)("resolves a known node to the line that actually declares it", () => {
        const index = buildSourceIndex(maestroRoot);
        const ref = index.resolve("warehouses:sheet", "0.0.0");
        expect(ref).not.toBeNull();
        const text = fs.readFileSync(ref!.file, "utf8").slice(ref!.start, ref!.end);
        expect(text).toContain("#DisplayCard");
    });
});
