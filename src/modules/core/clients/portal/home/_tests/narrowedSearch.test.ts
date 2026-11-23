import {describe, expect, it} from "vitest";
import {isNarrowedSearch} from "../catalogBrowse.ts";

const narrowed = (search: string) => isNarrowedSearch(new URLSearchParams(search));

describe("whether the visitor narrowed the catalog (TD-F158)", () => {
    it("is not narrowed by a kind, a sort or a page alone", () => {
        expect(narrowed("kind=product&sort=newest&page=2")).toBe(false);
    });

    it("is narrowed by words, a city, a price or a kind's filter", () => {
        expect(["q=lamp", "city=Tirana", "priceMin=10", "priceMax=50", "kind=car&f.transmission=automatic"].map(narrowed)).toEqual([true, true, true, true, true]);
    });
});
