import {afterEach, describe, expect, it, vi} from "vitest";
import type {PanelLayoutContributionArgs} from "@baseModule/helpers/types/panelLayoutContribution.types.ts";
import {createPanelLayoutContributions} from "@baseModule/helpers/moduleContributions/loadPanelLayoutContributions.ts";

const path = (pkg: string) => `/src/modules/${pkg}/clients/panel/panelLayoutContribution.ts`;
const args: PanelLayoutContributionArgs = {menu: "shop", subview: "pos", isMobile: false};

afterEach(() => {
    vi.restoreAllMocks();
});

describe("createPanelLayoutContributions", () => {
    it("returns the first class name by order", () => {
        const hook = vi.fn(({subview}: PanelLayoutContributionArgs) => (subview === "pos" ? "late" : undefined));
        const {resolveCenterPanelClassName} = createPanelLayoutContributions({
            [path("late")]: {default: {id: "late", order: 50, getCenterPanelClassName: hook}},
            [path("early")]: {default: {id: "early", order: 10, getCenterPanelClassName: () => "early"}},
        });
        expect(resolveCenterPanelClassName(args)).toBe("early");
        expect(hook).not.toHaveBeenCalled();
    });

    it("passes the args through and returns undefined when nobody answers", () => {
        const hook = vi.fn(() => undefined);
        const {resolveCenterPanelClassName} = createPanelLayoutContributions({[path("a")]: {default: {getCenterPanelClassName: hook}}});
        expect(resolveCenterPanelClassName(args)).toBeUndefined();
        expect(hook).toHaveBeenCalledWith(args);
        expect(createPanelLayoutContributions({}).resolveCenterPanelClassName(args)).toBeUndefined();
    });

    it("counts an empty class name as an answer", () => {
        const {resolveCenterPanelClassName} = createPanelLayoutContributions({
            [path("a")]: {default: [
                {order: 1, getCenterPanelClassName: () => ""},
                {order: 2, getCenterPanelClassName: () => "later"},
            ]},
        });
        expect(resolveCenterPanelClassName(args)).toBe("");
    });

    it("skips missing hooks, non-string answers and throwing hooks", () => {
        const error = vi.spyOn(console, "error").mockImplementation(() => {});
        const {resolveCenterPanelClassName} = createPanelLayoutContributions({
            [path("a")]: {default: [
                {id: "none", order: 1},
                {id: "number", order: 2, getCenterPanelClassName: () => 42},
                {id: "null", order: 3, getCenterPanelClassName: () => null},
                {id: "broken", order: 4, getCenterPanelClassName: () => {
                    throw new Error("boom");
                }},
                {id: "ok", order: 5, getCenterPanelClassName: () => "ok"},
            ]},
        });
        expect(resolveCenterPanelClassName(args)).toBe("ok");
        expect(error).toHaveBeenCalledWith(expect.stringContaining(`"broken" threw`), expect.any(Error));
    });

    it.each([
        ["a primitive entry", [1]],
        ["a non-function hook", [{getCenterPanelClassName: "px-0"}]],
    ])("rejects %s (previously accepted unchecked)", (_label, exported) => {
        const {resolveCenterPanelClassName} = createPanelLayoutContributions({[path("bad")]: {default: exported}});
        expect(() => resolveCenterPanelClassName(args)).toThrow(`Invalid entry at ${path("bad")}[0]`);
    });
});
