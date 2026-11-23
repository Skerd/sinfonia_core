import {act, render} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {Link, MemoryRouter, Outlet, Route, Routes} from "react-router-dom";

const {siteState} = vi.hoisted(() => ({siteState: {name: "Kudoo" as string | undefined}}));

vi.mock("../portalSiteContext.tsx", () => ({
    usePortalSite: () => ({site: siteState.name ? {scope: "platform", company: {name: siteState.name}} : undefined, sections: []}),
}));

import {usePortalTitle, usePortalTitleReset} from "../portalTitle.ts";

function Titled({title}: {title: string | null | undefined}) {
    usePortalTitle(title);
    return null;
}

/** The portal's shell, its links, and pages that name themselves or not. */
function Shell() {
    usePortalTitleReset();
    return (
        <>
            <Link to="/item">item</Link>
            <Link to="/untitled">untitled</Link>
            <Link to="/loading">loading</Link>
            <Outlet />
        </>
    );
}

const mount = (path: string) => render(
    <MemoryRouter initialEntries={[path]}>
        <Routes>
            <Route element={<Shell />}>
                <Route index element={<Titled title={null} />} />
                <Route path="item" element={<Titled title="Blue Sedan" />} />
                <Route path="untitled" element={null} />
                <Route path="loading" element={<Titled title={undefined} />} />
            </Route>
        </Routes>
    </MemoryRouter>,
);

const follow = (name: string, container: HTMLElement) => act(() => {
    container.querySelector<HTMLAnchorElement>(`a[href='/${name}']`)?.click();
});

/* D181: every portal page names itself in the browser tab, the site's name last. */
describe("usePortalTitle", () => {
    beforeEach(() => {
        siteState.name = "Kudoo";
        document.title = "Server title";
    });

    it("puts the page's title before the site's name", () => {
        mount("/item");
        expect(document.title).toBe("Blue Sedan · Kudoo");
    });

    it("names the site alone for null", () => {
        mount("/");
        expect(document.title).toBe("Kudoo");
    });

    it("keeps the title the server sent on the first page while that page's own title is unknown", () => {
        mount("/loading");
        expect(document.title).toBe("Server title");
    });

    it("keeps the title the server sent on a first page that never names itself", () => {
        mount("/untitled");
        expect(document.title).toBe("Server title");
    });

    it("leaves the tab alone while the site is not known", () => {
        siteState.name = undefined;
        mount("/item");
        expect(document.title).toBe("Server title");
    });

    it("shows the site's name, not the previous page's title, on a page reached by a link that does not name itself", () => {
        const {container} = mount("/item");
        follow("untitled", container);
        expect(document.title).toBe("Kudoo");
        follow("item", container);
        expect(document.title).toBe("Blue Sedan · Kudoo");
        follow("loading", container);
        expect(document.title).toBe("Kudoo");
    });
});
