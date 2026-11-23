import {describe, expect, it} from "vitest";
import {isSavableSearch, savedSearchHref, savedSearchLabel, savedSearchQuery} from "../savedSearch.ts";

/* D178, P23.7: a saved search is the home catalog's browse query itself. */

const words: Record<string, string> = {all: "All", labelPriceFrom: "from {min}", labelPriceUpTo: "up to {max}", labelFilters: "{count} filters", labelFilterOne: "1 filter"};
const resolveLanguageKey = (key: string) => words[key] ?? key;

describe("saved searches on the home catalog", () => {
    it("keeps the search on screen without its page or sort, and opens it again newest first", () => {
        const params = new URLSearchParams("kind=vehicleCategory&q=%20bmw%20&city=Tirana&priceMax=80&f.transmission=automatic&page=3&sort=priceAsc");
        const search = savedSearchQuery(params);

        expect(search).toEqual({kind: "vehicleCategory", query: "bmw", city: "Tirana", priceMin: undefined, priceMax: 80, filters: {transmission: "automatic"}});
        expect(savedSearchHref(search)).toBe("/?kind=vehicleCategory&q=bmw&city=Tirana&priceMax=80&f.transmission=automatic&sort=newest");
        expect(savedSearchHref({...search, filters: {color: ["red", "blue"]}})).toContain("f.color=red&f.color=blue");
    });

    it("offers saving only a search: a kind, words or a city", () => {
        expect(isSavableSearch(savedSearchQuery(new URLSearchParams("")))).toBe(false);
        expect(isSavableSearch(savedSearchQuery(new URLSearchParams("sort=newest&page=2")))).toBe(false);
        expect(isSavableSearch(savedSearchQuery(new URLSearchParams("q=lamp")))).toBe(true);
        expect(isSavableSearch(savedSearchQuery(new URLSearchParams("kind=product")))).toBe(true);
    });

    it("reads as words in the visitor's language", () => {
        const search = savedSearchQuery(new URLSearchParams("kind=vehicleCategory&q=bmw&city=Tirana&priceMin=20&priceMax=80&f.transmission=automatic&f.seats=5"));
        expect(savedSearchLabel(search, {kindName: "Cars", resolveLanguageKey})).toBe("Cars · “bmw” · Tirana · 20–80 · 2 filters");
        expect(savedSearchLabel(savedSearchQuery(new URLSearchParams("q=lamp&priceMax=50")), {resolveLanguageKey})).toBe("All · “lamp” · up to 50");
        expect(savedSearchLabel(savedSearchQuery(new URLSearchParams("kind=product&priceMin=5&f.brand=x")), {kindName: "Products", resolveLanguageKey})).toBe("Products · from 5 · 1 filter");
    });
});
