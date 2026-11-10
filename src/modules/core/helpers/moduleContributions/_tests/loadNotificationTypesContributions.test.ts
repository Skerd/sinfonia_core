import {describe, expect, it} from "vitest";
import {createNotificationTypesContributions} from "@coreModule/helpers/moduleContributions/loadNotificationTypesContributions.ts";

const file = (pkg: string, locale: string) => `/src/modules/${pkg}/assets/languages/${locale}/notificationTypes.json`;
const glob = {
    [file("widgets", "en-US")]: {
        widgets: {
            title: "Widgets",
            codes: {
                WIDGET_SHIPPED: {title: "Widget shipped", message: "Widget {name} shipped"},
                // A security notice: translated, never listed, since it cannot be turned off.
                WIDGET_KEY_CHANGED: {message: "The key of widget {name} changed"},
                WIDGET_DUE: {
                    title: "Widget due",
                    message: "Widget {name} is due in {days} days",
                    variants: {today: "Widget {name} is due today"},
                },
            },
        },
    },
    [file("widgets", "de-CH")]: {
        widgets: {title: "Widgets DE", codes: {WIDGET_SHIPPED: {title: "Widget versandt", message: "Widget {name} versandt"}}},
    },
    [file("gadgets", "en-US")]: {gadgets: {title: "Gadgets", codes: {GADGET_LOST: {title: "Gadget lost", message: "Gadget lost"}}}},
    [file("core", "en-US")]: {core: {title: "Core", codes: {CORE_CODE: {title: "Core code", message: "Core {name}"}}}},
};
const active = new Set(["widgets", "gadgets"]);
const types = createNotificationTypesContributions(glob, ["en-US"], (name) => active.has(name));

describe("createNotificationTypesContributions (D117)", () => {
    it("fills the code's message with the stored params, in the reader's language", () => {
        expect(types.notificationMessage({code: "WIDGET_SHIPPED", params: {name: "Blue"}}, "de-CH")).toBe("Widget Blue versandt");
        expect(types.notificationMessage({code: "WIDGET_SHIPPED", params: {name: "Blue"}}, "en-US")).toBe("Widget Blue shipped");
    });

    it("translates a code without a title but does not list it", () => {
        expect(types.notificationMessage({code: "WIDGET_KEY_CHANGED", params: {name: "Blue"}}, "de-CH")).toBe("The key of widget Blue changed");
        expect(types.getNotificationTypeGroups("en-US").flatMap((group) => group.types.map((type) => type.code))).not.toContain("WIDGET_KEY_CHANGED");
    });

    it("uses the variant the params name, else the message", () => {
        expect(types.notificationMessage({code: "WIDGET_DUE", params: {name: "Blue", days: 3}}, "en-US")).toBe("Widget Blue is due in 3 days");
        expect(types.notificationMessage({code: "WIDGET_DUE", params: {name: "Blue", variant: "today"}}, "en-US")).toBe("Widget Blue is due today");
        expect(types.notificationMessage({code: "WIDGET_DUE", params: {name: "Blue", days: 3, variant: "unknown"}}, "en-US")).toBe("Widget Blue is due in 3 days");
    });

    it("falls back to en-US for a code a locale has not translated", () => {
        expect(types.notificationMessage({code: "WIDGET_DUE", params: {variant: "today", name: "Red"}}, "de-CH")).toBe("Widget Red is due today");
        expect(types.notificationTitle("GADGET_LOST", "fr-FR")).toBe("Gadget lost");
    });

    // TD-B173: core's own notices were left out, so they showed the stored English text.
    it("translates core's own notices too", () => {
        expect(types.notificationMessage({code: "CORE_CODE", params: {name: "Blue"}}, "de-CH")).toBe("Core Blue");
        expect(types.notificationTitle("CORE_CODE", "en-US")).toBe("Core code");
    });

    it("returns null for a code no module declares, so the stored English text is shown", () => {
        expect(types.notificationMessage({code: "UNKNOWN"}, "en-US")).toBeNull();
        expect(types.notificationTitle("UNKNOWN", "en-US")).toBeNull();
    });

    it("leaves a placeholder without a value visible", () => {
        expect(types.notificationMessage({code: "WIDGET_SHIPPED", params: {}}, "en-US")).toBe("Widget {name} shipped");
    });

    // A notice stored before its module sent params would otherwise read "Widget {name} shipped".
    it("returns null for a notice without params whose message needs values, so its stored text is shown", () => {
        expect(types.notificationMessage({code: "WIDGET_SHIPPED"}, "en-US")).toBeNull();
        expect(types.notificationMessage({code: "GADGET_LOST"}, "en-US")).toBe("Gadget lost");
    });

    it("lists the active modules' types under their titles, for the preferences", () => {
        expect(types.getNotificationTypeGroups("de-CH")).toEqual([
            {id: "gadgets", title: "Gadgets", types: [{code: "GADGET_LOST", title: "Gadget lost"}]},
            {id: "widgets", title: "Widgets DE", types: [{code: "WIDGET_SHIPPED", title: "Widget versandt"}, {code: "WIDGET_DUE", title: "Widget due"}]},
        ]);
        active.delete("gadgets");
        expect(types.getNotificationTypeGroups("en-US").map((group) => group.id)).toEqual(["widgets"]);
        active.add("gadgets");
    });
});
