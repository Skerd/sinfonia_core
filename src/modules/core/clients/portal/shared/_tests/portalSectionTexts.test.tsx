import {renderHook, waitFor} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";
import withLanguage from "@coreModule/helpers/hocs/withLanguage.tsx";
import {languagePathOf} from "@coreModule/helpers/hocs/languagePath.ts";
import {componentLanguageLoader} from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
import type {PortalSection} from "@coreModule/helpers/types/portalContribution.types.ts";
import {usePortalSectionTexts} from "../portalSectionTexts.ts";

/* Core dictionaries stand in for a section's parts. */
const FILTERS_PATH = "src/modules/core/clients/portal/home/catalog.tsx";
const ACCOUNT_PATH = "src/modules/core/clients/portal/shared/portalCompanySite.tsx";
const Filters = withLanguage(FILTERS_PATH)(() => null);
const AccountSection = withLanguage(ACCOUNT_PATH)(() => null);
const Plain = () => null;

describe("languagePathOf", () => {
    it("names the dictionary of a withLanguage component, and of nothing else", () => {
        expect(languagePathOf(Filters)).toBe(FILTERS_PATH);
        expect(languagePathOf(Plain)).toBeUndefined();
        expect(languagePathOf(undefined)).toBeUndefined();
    });
});

describe("usePortalSectionTexts", () => {
    afterEach(() => {
        vi.useRealTimers();
        componentLanguageLoader.clear();
    });

    it("loads the text of a kind's filters and a section's account block after the first paint (TD-F145)", async () => {
        vi.useFakeTimers({shouldAdvanceTime: true});
        componentLanguageLoader.clear();
        const sections: PortalSection[] = [{section: "shop", path: "shop", AccountSection, catalogs: [{kind: "product", Filters}, {kind: "plain", Intro: Plain}]}];

        renderHook(() => usePortalSectionTexts(sections, "it-IT"));
        expect(componentLanguageLoader.peek(FILTERS_PATH, "it-IT")).toBeUndefined();

        vi.advanceTimersByTime(400);
        await waitFor(() => expect(componentLanguageLoader.peek(FILTERS_PATH, "it-IT")).toMatchObject({loading: expect.any(String)}));
        await waitFor(() => expect(componentLanguageLoader.peek(ACCOUNT_PATH, "it-IT")).toMatchObject({loading: expect.any(String)}));
    });
});
