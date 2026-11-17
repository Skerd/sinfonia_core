import {describe, expect, it} from "vitest";

const files = import.meta.glob("../languages/*/clients/panel/**/*.json", {eager: true, import: "default"}) as Record<string, Record<string, any>>;
const locales = ["en-US", "de-CH", "fr-FR", "it-IT", "sq-AL"];

// TD-F121: the breadcrumb read "Savedsearches" (a humanized route segment), and Performance read "Last updated:: 20:10".
describe("panel labels", () => {
    it("name every account tab in the breadcrumb", () => {
        for (const locale of locales) {
            const account = files[`../languages/${locale}/clients/panel/entryPoint/index.json`].menus.account;
            for (const tab of ["security", "notifications", "notificationCenter", "apps", "addresses", "savedsearches", "providerprofile"]) {
                expect(account[tab]?.title, `${locale} ${tab}`).toBeTruthy();
            }
        }
    });

    it("leave the colon to the page", () => {
        const texts = Object.entries(files).filter(([path]) => path.includes("/clients/panel/private/online/"))
            .map(([path, json]) => [path, json.lastUpdated]).filter(([, text]) => typeof text === "string");
        expect(texts.length).toBeGreaterThan(0);
        for (const [path, text] of texts) expect(text, path).toMatch(/^\S.*[^:\s]$/);
    });
});
