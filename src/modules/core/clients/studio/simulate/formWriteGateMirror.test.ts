import {describe, expect, it} from "vitest";
import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {countHiddenByWriteGate, rendersOnEditForm} from "./formWriteGateMirror.ts";

const write = new Set(["name", "polygonCoordinates", "items"]);

function field(node: Partial<ViewNode["field"]> & {name: string; widget: string}): ViewNode {
    return {render: node.widget, field: node as ViewNode["field"]};
}

describe("rendersOnEditForm", () => {
    it("renders a writable field and drops a non-writable one", () => {
        expect(rendersOnEditForm(field({name: "name", widget: "#Input"}), write)).toBe(true);
        expect(rendersOnEditForm(field({name: "code", widget: "#Input"}), write)).toBe(false);
    });

    it("always renders `_id` and fields that opt out of the gate", () => {
        expect(rendersOnEditForm(field({name: "_id", widget: "#Input"}), write)).toBe(true);
        expect(
            rendersOnEditForm(
                field({name: "helper", widget: "#Input", skipWriteAccessGate: true}),
                write,
            ),
        ).toBe(true);
    });

    it("renders on any listed key when `renderWhenWriteAny` is set", () => {
        expect(
            rendersOnEditForm(
                field({name: "code", widget: "#Input", renderWhenWriteAny: ["name"]}),
                write,
            ),
        ).toBe(true);
        expect(
            rendersOnEditForm(
                field({name: "code", widget: "#Input", renderWhenWriteAny: ["other"]}),
                write,
            ),
        ).toBe(false);
    });

    it("gates compound widgets on their own key, not the field name", () => {
        expect(
            rendersOnEditForm(field({name: "floorPlan", widget: "#FormFloorPolygon"}), write),
        ).toBe(true);
        expect(
            rendersOnEditForm(field({name: "media", widget: "#FormEditMediaField"}), write),
        ).toBe(false);
    });

    it("gates other compound widgets on field.name", () => {
        expect(
            rendersOnEditForm(field({name: "notes", widget: "#Textarea"}), write),
        ).toBe(false);
        expect(
            rendersOnEditForm(field({name: "name", widget: "#SomeCompoundField"}), write),
        ).toBe(true);
    });

    it("lets `#FormTabbedRepeater` name its key, falling back to the field name", () => {
        expect(
            rendersOnEditForm(
                field({
                    name: "anything",
                    widget: "#FormTabbedRepeater",
                    widgetProps: {writeAccessKey: "items"},
                }),
                write,
            ),
        ).toBe(true);
        expect(
            rendersOnEditForm(field({name: "anything", widget: "#FormTabbedRepeater"}), write),
        ).toBe(false);
    });

    it("leaves layout nodes alone", () => {
        expect(rendersOnEditForm({render: "#FormGrid"}, write)).toBe(true);
    });
});

describe("countHiddenByWriteGate", () => {
    it("counts bound fields the panel would not render, at any depth", () => {
        const nodes: ViewNode[] = [
            {
                render: "#FormGrid",
                children: [
                    field({name: "name", widget: "#Input"}),
                    field({name: "code", widget: "#Input"}),
                    field({name: "secret", widget: "#Input"}),
                ],
            },
            field({name: "_id", widget: "#Input"}),
        ];

        expect(countHiddenByWriteGate(nodes, write)).toBe(2);
    });
});
