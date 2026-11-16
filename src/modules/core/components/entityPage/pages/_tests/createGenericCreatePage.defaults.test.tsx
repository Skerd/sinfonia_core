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
const access = vi.hoisted(() => ({create: true, request: false, requestable: false}));
vi.mock("@coreModule/helpers/hooks/useAccess.ts", () => ({
    useAccess: () => ({create: access.create, requestable: access.requestable}),
}));
vi.mock("@coreModule/helpers/hooks/useActionAccess.ts", () => ({
    useActionAccess: (_collection: string, action: string) => action === "request" && access.request,
}));
vi.mock("@coreModule/components/custom/pages/forbidden.tsx", () => ({
    default: () => <p data-testid="forbidden" />,
}));
vi.mock("@coreModule/helpers/hooks/useViewConfig.ts", () => ({
    useViewConfigState: () => ({config: {nodes: []}, loading: false}),
}));
// UTC+14: at noon UTC it is already the next calendar day there.
vi.mock("@coreModule/helpers/hooks/useCompanyTimeZone.ts", () => ({
    useCompanyTimeZone: () => "Pacific/Kiritimati",
}));
vi.mock("@coreModule/components/viewEngine/FormViewRenderer.tsx", () => ({
    default: ({defaultValues, resolveLanguageKey}: {defaultValues: unknown; resolveLanguageKey: (key: string) => string}) => (
        <>
            <pre data-testid="defaults">{JSON.stringify(defaultValues)}</pre>
            <p data-testid="submit">{resolveLanguageKey("formButtons.submit")}</p>
        </>
    ),
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
        access.create = true;
        access.request = false;
        access.requestable = false;
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

    it("opens a requestable list's form with the request permission alone (D160), and no other model's", () => {
        // The access map flags the model requestable (no create grant there): the request permission opens the form.
        access.create = false;
        access.request = true;
        access.requestable = true;
        expect(renderDefaults(createGenericCreatePage<{title: string}>(base))).toEqual({});

        // Any other model without the create grant stays closed, request permission or not.
        access.requestable = false;
        const Plain = createGenericCreatePage<{title: string}>(base);
        render(<MemoryRouter><Plain /></MemoryRouter>);
        expect(screen.getByTestId("forbidden")).toBeTruthy();
    });

    it("keeps the create wording on an ordinary create (D160)", () => {
        // The language mock resolves every key to itself, so the key the form asked for is what renders.
        render(<MemoryRouter><Creating /></MemoryRouter>);
        expect(screen.getByTestId("submit").textContent).toBe("formButtons.submit");
    });

    it("uses the request wording when a company without the create grant requests on a requestable list", () => {
        access.create = false;
        access.request = true;
        access.requestable = true;
        render(<MemoryRouter><Creating /></MemoryRouter>);
        expect(screen.getByTestId("submit").textContent).toBe("request.formButtons.submit");
    });
});

const Creating = createGenericCreatePage<{title: string}>(base);
