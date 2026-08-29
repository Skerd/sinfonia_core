import {describe, expect, it} from "vitest";
import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {
    clearInspectorKey,
    deadConfigEntries,
    inspectorValue,
    isEditForm,
    isValueSet,
    relevanceFor,
    type InspectorKey,
    type ViewShape,
} from "./fieldRelevance.ts";

const SHEET: ViewShape = {viewType: "sheet"};
const CREATE: ViewShape = {viewType: "form", viewMode: "create"};
const EDIT: ViewShape = {viewType: "form", viewMode: "edit"};
/** Maestro treats a form with no `viewMode` as edit; so must we. */
const LEGACY_FORM: ViewShape = {viewType: "form"};

const bound: ViewNode = {render: "#Field", field: {name: "name", widget: "#Input"}};
const layout: ViewNode = {render: "#SheetGroup", props: {title: "overview"}, children: []};

function state(key: InspectorKey, shape: ViewShape, node: ViewNode = bound) {
    return relevanceFor(key, shape, node).state;
}

describe("isEditForm", () => {
    it("covers edit and legacy forms, but not sheets or create forms", () => {
        expect(isEditForm(EDIT)).toBe(true);
        expect(isEditForm(LEGACY_FORM)).toBe(true);
        expect(isEditForm(CREATE)).toBe(false);
        expect(isEditForm(SHEET)).toBe(false);
    });
});

describe("relevanceFor — write permissions", () => {
    it("is live only on edit forms", () => {
        expect(state("permissions.write", EDIT)).toBe("primary");
        expect(state("permissions.writeAny", EDIT)).toBe("advanced");
        expect(state("permissions.write", LEGACY_FORM)).toBe("primary");

        expect(state("permissions.write", SHEET)).toBe("inapplicable");
        expect(state("permissions.writeAny", SHEET)).toBe("inapplicable");
        expect(state("permissions.write", CREATE)).toBe("inapplicable");
        expect(state("permissions.writeAny", CREATE)).toBe("inapplicable");
    });

    it("explains itself differently for a sheet and a create form", () => {
        const sheetReason = relevanceFor("permissions.write", SHEET, bound).reason ?? "";
        const createReason = relevanceFor("permissions.write", CREATE, bound).reason ?? "";
        expect(sheetReason).not.toBe(createReason);
        expect(createReason).toMatch(/create/i);
    });
});

describe("relevanceFor — read permissions", () => {
    it("stays live everywhere, because the server prunes on it for every view type", () => {
        expect(state("permissions.read", SHEET)).toBe("primary");
        expect(state("permissions.read", CREATE)).toBe("primary");
        expect(state("permissions.read", EDIT)).toBe("primary");
    });

    it("keeps readAny out of the way, and says why when read already wins", () => {
        expect(state("permissions.readAny", SHEET)).toBe("advanced");
        const withRead: ViewNode = {...bound, permissions: {read: "price"}};
        expect(relevanceFor("permissions.readAny", SHEET, withRead).reason).toMatch(/overrides/);
    });
});

describe("relevanceFor — form-only field options", () => {
    it("hides required, placeholder and disabled on a sheet", () => {
        for (const key of ["field.required", "field.placeholder", "field.disabled"] as const) {
            expect(state(key, SHEET)).toBe("inapplicable");
            expect(state(key, CREATE)).toBe("primary");
            expect(state(key, EDIT)).toBe("primary");
        }
    });
});

describe("relevanceFor — access gate opt-outs", () => {
    it("offers the write gates only on edit forms", () => {
        for (const key of ["field.skipWriteAccessGate", "field.renderWhenWriteAny"] as const) {
            expect(state(key, EDIT)).toBe("advanced");
            expect(state(key, SHEET)).toBe("inapplicable");
            expect(state(key, CREATE)).toBe("inapplicable");
        }
    });

    it("offers the read gate only on sheets", () => {
        expect(state("field.skipReadAccessGate", SHEET)).toBe("advanced");
        expect(state("field.skipReadAccessGate", CREATE)).toBe("inapplicable");
        expect(state("field.skipReadAccessGate", EDIT)).toBe("inapplicable");
    });
});

describe("relevanceFor — dependent", () => {
    it("hides dependentRuntimeOnly until there is a dependency to evaluate", () => {
        expect(state("dependentRuntimeOnly", SHEET, layout)).toBe("inapplicable");
        expect(state("dependentRuntimeOnly", SHEET, {...layout, dependent: "price"})).toBe("primary");
        expect(state("dependentRuntimeOnly", SHEET, {...layout, dependentAny: ["a", "b"]})).toBe(
            "primary",
        );
    });

    it("demotes dependentAny once dependent is set", () => {
        expect(state("dependentAny", SHEET, layout)).toBe("primary");
        expect(state("dependentAny", SHEET, {...layout, dependent: "price"})).toBe("advanced");
    });
});

describe("isValueSet", () => {
    it("treats cleared-control values as unset", () => {
        expect(isValueSet(undefined)).toBe(false);
        expect(isValueSet(null)).toBe(false);
        expect(isValueSet("")).toBe(false);
        /* Toggles write `value || undefined`, so `false` never means "authored". */
        expect(isValueSet(false)).toBe(false);
        expect(isValueSet([])).toBe(false);
        expect(isValueSet({})).toBe(false);
    });

    it("treats real values as set", () => {
        expect(isValueSet("price")).toBe(true);
        expect(isValueSet(true)).toBe(true);
        expect(isValueSet(0)).toBe(true);
        expect(isValueSet(["a"])).toBe(true);
        expect(isValueSet({apiUrl: "/x"})).toBe(true);
    });
});

describe("inspectorValue", () => {
    it("reads through the permissions and field namespaces", () => {
        const node: ViewNode = {
            render: "#Field",
            dependent: "price",
            permissions: {read: "price", write: "price"},
            field: {name: "price", widget: "#Input", required: true},
        };
        expect(inspectorValue(node, "dependent")).toBe("price");
        expect(inspectorValue(node, "permissions.write")).toBe("price");
        expect(inspectorValue(node, "field.required")).toBe(true);
        expect(inspectorValue(node, "field.placeholder")).toBeUndefined();
    });
});

describe("clearInspectorKey", () => {
    it("drops the permissions object once its last key goes", () => {
        const node: ViewNode = {render: "div", permissions: {write: "price"}};
        expect(clearInspectorKey(node, "permissions.write").permissions).toBeUndefined();
    });

    it("keeps sibling permissions", () => {
        const node: ViewNode = {render: "div", permissions: {read: "price", write: "price"}};
        expect(clearInspectorKey(node, "permissions.write").permissions).toEqual({read: "price"});
    });

    it("clears a field option without unbinding the field", () => {
        const node: ViewNode = {
            render: "#Field",
            field: {name: "price", widget: "#Input", required: true},
        };
        const next = clearInspectorKey(node, "field.required");
        expect(next.field).toEqual({name: "price", widget: "#Input"});
    });

    it("is a no-op on an unbound node", () => {
        const node: ViewNode = {render: "div"};
        expect(clearInspectorKey(node, "field.required")).toBe(node);
    });

    it("clears a top-level key", () => {
        const node: ViewNode = {render: "div", dependentRuntimeOnly: true};
        expect(clearInspectorKey(node, "dependentRuntimeOnly").dependentRuntimeOnly).toBeUndefined();
    });
});

describe("deadConfigEntries", () => {
    it("reports write permissions authored on a sheet", () => {
        const node: ViewNode = {
            render: "#DisplayCard",
            permissions: {read: "price", write: "price"},
            field: {name: "price", widget: "#DisplayCard"},
        };
        const entries = deadConfigEntries(node, SHEET);
        expect(entries.map((e) => e.key)).toEqual(["permissions.write"]);
        expect(entries[0]!.value).toBe("price");
        expect(entries[0]!.reason).toBeTruthy();
    });

    it("reports form-only field options authored on a sheet", () => {
        const node: ViewNode = {
            render: "#DisplayCard",
            field: {name: "price", widget: "#DisplayCard", required: true, placeholder: "form.x"},
        };
        expect(deadConfigEntries(node, SHEET).map((e) => e.key).sort()).toEqual([
            "field.placeholder",
            "field.required",
        ]);
    });

    it("reports skipReadAccessGate authored on a form", () => {
        const node: ViewNode = {
            render: "#Field",
            field: {name: "price", widget: "#Input", skipReadAccessGate: true},
        };
        expect(deadConfigEntries(node, EDIT).map((e) => e.key)).toEqual([
            "field.skipReadAccessGate",
        ]);
    });

    it("stays quiet when the inapplicable keys are merely absent", () => {
        expect(deadConfigEntries(bound, SHEET)).toEqual([]);
        expect(deadConfigEntries(layout, EDIT)).toEqual([]);
    });

    it("stays quiet for a false toggle, which is how the inspector clears one", () => {
        const node: ViewNode = {
            render: "#DisplayCard",
            field: {name: "price", widget: "#DisplayCard", required: false},
        };
        expect(deadConfigEntries(node, SHEET)).toEqual([]);
    });

    it("survives a round trip: clearing every entry empties the report", () => {
        let node: ViewNode = {
            render: "#DisplayCard",
            permissions: {write: "price", writeAny: ["a"]},
            field: {name: "price", widget: "#DisplayCard", required: true, disabled: true},
        };
        for (const entry of deadConfigEntries(node, SHEET)) {
            node = clearInspectorKey(node, entry.key);
        }
        expect(deadConfigEntries(node, SHEET)).toEqual([]);
        expect(node.permissions).toBeUndefined();
        expect(node.field).toEqual({name: "price", widget: "#DisplayCard"});
    });
});
