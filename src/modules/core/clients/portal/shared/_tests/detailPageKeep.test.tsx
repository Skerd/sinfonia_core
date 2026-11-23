import {describe, expect, it, vi} from "vitest";
import {render, screen} from "@testing-library/react";
import type {ComponentType} from "react";
import {MemoryRouter} from "react-router-dom";
import type {PortalKeepItem} from "../portalSaved.tsx";

/* TD-F148: an item's page carries the same heart as its card. */

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key} />,
}));
vi.mock("../portalTitle.ts", () => ({usePortalTitle: () => undefined}));
vi.mock("../portalKindName.tsx", () => ({default: ({kind}: {kind: string}) => <>{kind}</>}));
vi.mock("../portalSaved.tsx", () => ({
    PortalKeepButton: ({item}: {item: PortalKeepItem}) => <button type="button" aria-label={`keep ${item.title}`} data-item={JSON.stringify(item)} />,
}));

import DetailPage from "../detailPage.tsx";

const lamp: PortalKeepItem = {kind: "product", id: "p1", section: "shop", path: "/product?id=p1", title: "Desk lamp"};

function renderPage(keep?: PortalKeepItem) {
    return render(<MemoryRouter><DetailPage kind="product" title="Desk lamp" keep={keep}><p>column</p></DetailPage></MemoryRouter>);
}

describe("DetailPage heart (TD-F148)", () => {
    it("shows the item's heart with the item the catalog's card keeps", () => {
        renderPage(lamp);
        expect(JSON.parse(screen.getByRole("button", {name: "keep Desk lamp"}).getAttribute("data-item") ?? "{}")).toEqual(lamp);
    });

    it("shows none on a page no card opens", () => {
        renderPage();
        expect(screen.queryByRole("button", {name: /keep/})).toBeNull();
    });
});
