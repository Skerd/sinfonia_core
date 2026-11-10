import {describe, expect, it} from "vitest";
import {panelLink} from "@coreModule/components/customUnchecked/systemMap/panelLink.ts";

describe("panelLink (TD-B174)", () => {
    it("keeps the route relative inside the panel", () => {
        expect(panelLink("/projects", "")).toEqual({href: "/projects", external: false});
    });

    it("opens the panel's origin from the studio", () => {
        expect(panelLink("/projects", "http://localhost:5173")).toEqual({href: "http://localhost:5173/projects", external: true});
        expect(panelLink("/projects", "https://panel.example/")).toEqual({href: "https://panel.example/projects", external: true});
    });
});
