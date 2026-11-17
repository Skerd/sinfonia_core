import {describe, expect, it, vi} from "vitest";

const {pages} = vi.hoisted(() => ({pages: [] as {languagePath: string; buildExtraTitles?: unknown}[]}));
vi.mock("@coreModule/components/entityPage/pages/createGenericEditPage.tsx", () => ({
    createGenericEditPage: (config: {languagePath: string; buildExtraTitles?: unknown}) => {
        pages.push(config);
        return () => null;
    },
}));

import "../cities/editCity.tsx";
import "../states/editState.tsx";

// TD-F119: the city edit page was titled "Albania / Vlorë County" (its country and state from the link), not the city.
describe("place edit pages", () => {
    it("are titled by the place being edited", () => {
        expect(pages.map((page) => page.languagePath.split("/").slice(-2).join("/"))).toEqual(["cities/editCity.tsx", "states/editState.tsx"]);
        for (const page of pages) expect(page.buildExtraTitles).toBeUndefined();
    });
});
