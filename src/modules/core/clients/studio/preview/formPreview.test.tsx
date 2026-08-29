import {MemoryRouter} from "react-router-dom";
import {render, screen} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import FormPreview from "./formPreview.tsx";

/**
 * The point of these: an edit preview must answer the way the panel answers. Maestro marks a
 * non-writable field `disabled`, but `EditFormViewRenderer` never renders it — so a preview
 * that shows a greyed-out input is showing a screen no account ever sees.
 */

function config(viewMode: "edit" | "create"): ViewConfig {
    return {
        model: "countries",
        viewType: "form",
        viewMode,
        accessModel: "countries",
        apiUrl: "/api/auxiliary/country",
        nodes: [
            {render: "#Input", field: {name: "name", widget: "#Input", label: "Name"}},
            {render: "#Input", field: {name: "code", widget: "#Input", label: "Code"}},
        ],
    };
}

/** `resolveLanguageKey` in the Studio returns the key itself when nothing is loaded. */
const resolveLanguageKey = ((key: string) => key) as never;

function renderPreview(viewMode: "edit" | "create", writeAccess?: Record<string, unknown>) {
    return render(
        <MemoryRouter>
            <FormPreview
                config={config(viewMode)}
                row={null}
                resolveLanguageKey={resolveLanguageKey}
                formExtras={undefined}
                writeAccess={writeAccess}
            />
        </MemoryRouter>,
    );
}

describe("FormPreview on an edit form", () => {
    it("drops a field the account cannot write, as the panel does", () => {
        renderPreview("edit", {name: true});

        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.queryByText("Code")).not.toBeInTheDocument();
    });

    it("keeps every field the account can write", () => {
        renderPreview("edit", {name: true, code: true});

        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.getByText("Code")).toBeInTheDocument();
    });
});

describe("FormPreview on a create form", () => {
    it("ignores the write map, because create pages do", () => {
        renderPreview("create", {name: true});

        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.getByText("Code")).toBeInTheDocument();
    });
});
