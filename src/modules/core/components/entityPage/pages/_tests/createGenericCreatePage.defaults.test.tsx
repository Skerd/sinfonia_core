import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";
import {MemoryRouter} from "react-router-dom";
import {render, screen} from "@testing-library/react";

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Inner: ComponentType<Record<string, unknown>>) => (props: Record<string, unknown>) =>
        <Inner {...props} resolveLanguageKey={(key: string) => key} languageCode="en-US" />,
}));
vi.mock("@coreModule/helpers/hocs/withAxios.tsx", () => ({
    default: () => (Inner: ComponentType<Record<string, unknown>>) => (props: Record<string, unknown>) =>
        <Inner {...props} loading={false} onPost={() => undefined} />,
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({
    default: () => (Inner: ComponentType) => Inner,
}));
vi.mock("@coreModule/helpers/hooks/useAccess.ts", () => ({
    useAccess: () => ({create: true}),
}));
vi.mock("@coreModule/helpers/hooks/useViewConfig.ts", () => ({
    useViewConfigState: () => ({config: {nodes: []}, loading: false}),
}));
// UTC+14: at noon UTC it is already the next calendar day there.
vi.mock("@coreModule/helpers/hooks/useCompanyTimeZone.ts", () => ({
    useCompanyTimeZone: () => "Pacific/Kiritimati",
}));
vi.mock("@coreModule/components/viewEngine/FormViewRenderer.tsx", () => ({
    default: ({defaultValues}: {defaultValues: unknown}) => <pre data-testid="defaults">{JSON.stringify(defaultValues)}</pre>,
}));

import {createGenericCreatePage} from "../createGenericCreatePage.tsx";
import {companyToday} from "@coreModule/helpers/general/dateTime.ts";

const base = {languagePath: "src/test.tsx", model: "things", apiUrl: "/api/test/thing", schema: () => null};

function renderDefaults(Page: ComponentType, url = "/") {
    render(<MemoryRouter initialEntries={[url]}><Page /></MemoryRouter>);
    return JSON.parse(screen.getByTestId("defaults").textContent ?? "null");
}

describe("createGenericCreatePage defaultValues (GLB-09, D116)", () => {
    beforeEach(() => {
        vi.useFakeTimers({toFake: ["Date"]});
        vi.setSystemTime(new Date("2026-03-01T12:00:00Z"));
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("hands a builder the URL and the company's zone, so a day default is the company's today", () => {
        const Page = createGenericCreatePage<{project?: string; updateDate: string}>({
            ...base,
            defaultValues: (params, {timeZone}) => ({project: params.get("projectId") ?? undefined, updateDate: companyToday(timeZone)}),
        });

        expect(renderDefaults(Page, "/?projectId=p1")).toEqual({project: "p1", updateDate: "2026-03-02"});
    });

    it("keeps plain default objects working", () => {
        const Plain = createGenericCreatePage<{title: string}>({...base, defaultValues: {title: "Draft"}});
        expect(renderDefaults(Plain)).toEqual({title: "Draft"});
    });

    it("gives an empty object when the page has no defaults", () => {
        const None = createGenericCreatePage<{title: string}>(base);
        expect(renderDefaults(None)).toEqual({});
    });
});
