import {memo} from "react";
import {describe, expect, it} from "vitest";
import {createWidgetContributions} from "@coreModule/helpers/moduleContributions/loadWidgetContributions.ts";

const path = (pkg: string) => `/src/modules/${pkg}/clients/panel/widgetContribution.tsx`;
const Widget = () => null;
const renderer = () => undefined;

const full = {
    id: "full",
    widgets: {"#A": Widget, "#B": memo(Widget)},
    widgetMeta: {"#A": {modes: ["sheet"]}},
    referencesDefaultItemProps: {"#A": "item"},
    sheetFieldRenderers: {"#A": renderer},
    compoundFormWidgets: ["#A"],
    compoundFormWidgetRenderers: {"#B": renderer},
    formWriteAccessKeys: {"#B": "field"},
    auditSinglePostHints: {"#A": {url: "/api/x/single", labelFields: ["name"]}},
};

describe("createWidgetContributions", () => {
    it("accepts a fully populated contribution and an empty one", () => {
        const {list} = createWidgetContributions({
            [path("a")]: {default: full},
            [path("b")]: {default: {id: "empty"}},
        });
        expect(list().map((c) => c.id)).toEqual(["empty", "full"]);
    });

    it("sorts by order, then id, then path, and memoizes", () => {
        const {list} = createWidgetContributions({
            [path("z")]: {default: {id: "same", order: 20}},
            [path("a")]: {default: [{id: "same", order: 20, widgets: {}}, {id: "first", order: 5}]},
            [path("m")]: {default: {order: 100}},
        });
        const result = list();
        expect(result.map((c) => c.id)).toEqual(["first", "same", "same", undefined]);
        expect(result[1].widgets).toEqual({});
        expect(list()).toBe(result);
    });

    it.each([
        ["widgets with a string", {widgets: {"#A": "div"}}],
        ["widgetMeta with a scalar", {widgetMeta: {"#A": true}}],
        ["referencesDefaultItemProps with a number", {referencesDefaultItemProps: {"#A": 1}}],
        ["sheetFieldRenderers with an object", {sheetFieldRenderers: {"#A": {}}}],
        ["compoundFormWidgets as a string", {compoundFormWidgets: "#A"}],
        ["compoundFormWidgets with a number", {compoundFormWidgets: ["#A", 2]}],
        ["compoundFormWidgetRenderers with a string", {compoundFormWidgetRenderers: {"#A": "x"}}],
        ["formWriteAccessKeys with an array", {formWriteAccessKeys: {"#A": ["x"]}}],
        ["an audit hint without url", {auditSinglePostHints: {"#A": {labelFields: []}}}],
        ["an audit hint with bad labels", {auditSinglePostHints: {"#A": {url: "/x", labelFields: [1]}}}],
        ["widgets as an array", {widgets: [Widget]}],
    ])("rejects %s", (_label, entry) => {
        const {list} = createWidgetContributions({[path("bad")]: {default: [entry]}});
        expect(() => list()).toThrow(`[widgetContribution] Invalid entry at ${path("bad")}[0]`);
    });
});
