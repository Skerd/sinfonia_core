import {afterEach, describe, expect, it, vi} from "vitest";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {HomeSetupStep} from "@coreModule/helpers/types/homeContribution.types.ts";
import {createHomeContributions} from "@coreModule/helpers/moduleContributions/loadHomeContributions.ts";

/* D178: modules list the setup steps a new company takes; the panel home shows them (core fixtures only). */

const path = (pkg: string) => `/src/modules/${pkg}/clients/panel/homeContribution.tsx`;
const resolve = ((key: string) => key.toUpperCase()) as ResolveLanguageKey;
const step = (key: string, title: string): HomeSetupStep => ({
    key, title, to: `/${key}/create`, accessModel: key, doneWhen: {list: {url: `/api/${key}`}},
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe("createHomeContributions", () => {
    it("returns every module's steps in contribution order, titled with the resolver", () => {
        const {getSetupSteps} = createHomeContributions({
            [path("fixtureShop")]: {default: {id: "shop", order: 40, getSetupSteps: ({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}) => [step("product", String(resolveLanguageKey("product")))]}},
            [path("fixtureRental")]: {default: {id: "rental", order: 20, getSetupSteps: ({resolveLanguageKey}: {resolveLanguageKey: ResolveLanguageKey}) => [
                step("location", String(resolveLanguageKey("location"))),
                step("vehicle", String(resolveLanguageKey("vehicle"))),
            ]}},
        });
        expect(getSetupSteps({resolveLanguageKey: resolve}).map(({key, title}) => `${key}:${title}`))
            .toEqual(["location:LOCATION", "vehicle:VEHICLE", "product:PRODUCT"]);
    });

    it("leaves out a throwing module and steps without what the checklist needs", () => {
        const error = vi.spyOn(console, "error").mockImplementation(() => {});
        const {getSetupSteps} = createHomeContributions({
            [path("fixture")]: {default: [
                {id: "broken", order: 1, getSetupSteps: () => {
                    throw new Error("boom");
                }},
                {id: "partial", order: 2, getSetupSteps: () => [{key: "noTarget", title: "x"}, step("ok", "Ok")]},
            ]},
        });
        expect(getSetupSteps({resolveLanguageKey: resolve}).map((entry) => entry.key)).toEqual(["ok"]);
        expect(error).toHaveBeenCalledTimes(1);
    });
});
