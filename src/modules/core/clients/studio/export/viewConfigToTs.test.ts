import {describe, expect, it} from "vitest";
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {suggestExportName, viewConfigToTs} from "./viewConfigToTs.ts";

/**
 * `#ApiSelect` widget props carry `field` as a form-path *string*
 * (`postBodyFromFormField: { field: "project" }`). The exporter must not treat
 * that the same as a ViewNode `field` FieldBinding object.
 */
function formWithPostBodyFromField(): ViewConfig {
    return {
        model: "constructionUpdates",
        viewType: "form",
        viewMode: "create",
        accessModel: "constructionUpdates",
        apiUrl: "/api/realEstate/constructionUpdate",
        nodes: [
            {
                render: "#Field",
                field: {
                    name: "edifice",
                    widget: "#ApiSelect",
                    label: "form.edificeLabel",
                    widgetProps: {
                        apiUrl: "/api/realEstate/edifice/select",
                        postBodyFromFormField: {field: "project", paramName: "project"},
                        postBodyFromFormFields: [
                            {field: "project", paramName: "project"},
                            {field: "edifice", paramName: "edifice"},
                        ],
                    },
                },
            },
        ],
    };
}

describe("viewConfigToTs", () => {
    it("prints widget-prop `field` strings instead of treating them as FieldBindings", () => {
        const config = formWithPostBodyFromField();
        const code = viewConfigToTs(config, {exportName: suggestExportName(config)});

        expect(code).toContain('postBodyFromFormField: {\n');
        expect(code).toContain('field: "project"');
        expect(code).toContain('paramName: "project"');
        expect(code).toContain('field: "edifice"');
        expect(code).toMatch(/field: \{\n\s+name: "edifice"/);
    });
});
