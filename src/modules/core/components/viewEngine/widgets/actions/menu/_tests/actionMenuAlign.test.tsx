import {fireEvent, render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";
import {MemoryRouter} from "react-router-dom";

vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => Wrapped,
}));
vi.mock("@coreModule/helpers/hooks/useAccess.ts", () => ({useAccess: () => ({read: true, write: true, delete: true, restore: true})}));
vi.mock("@coreModule/helpers/hooks/useSelectedLanguage.ts", () => ({
    warmComponentLanguage: () => undefined,
    default: () => ({currentLanguage: null, languageCode: "en-US", loading: false}),
}));

import ActionMenu from "../actionMenu.tsx";

// TD-F128: the ⋮ sits at the right edge of rows, cards and sheets; a menu aligned to its left edge ran past the page.
describe("action menu", () => {
    it("opens aligned to the right of its ⋮, towards the page", async () => {
        render(
            <MemoryRouter>
                <ActionMenu deletedData={{}} accessModel="countries" editPath="" hideView hideEdit hideDelete hideRestore allowMenuForCustomChildren>
                    <div>Do something</div>
                </ActionMenu>
            </MemoryRouter>,
        );
        const trigger = screen.getByRole("button");
        fireEvent.pointerDown(trigger, {button: 0, ctrlKey: false, pointerType: "mouse"});

        const item = await screen.findByText("Do something");
        expect(item.closest("[data-slot=dropdown-menu-content]")?.getAttribute("data-align")).toBe("end");
    });
});
