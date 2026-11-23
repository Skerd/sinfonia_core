import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType, ReactNode} from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import type {SandboxStateResponse} from "armonia/src/modules/core/api/company/private/sandbox/sandbox.dto.ts";
import dictionary from "@coreModule/assets/languages/en-US/clients/panel/private/home/sampleCompanyCard.json";

/* D178, P23.4: "Try with sample data" on the panel home. */

const fixture = vi.hoisted(() => ({
    state: {} as SandboxStateResponse,
    refused: false,
    writes: [] as {method: string; body: unknown}[],
    relogin: vi.fn(),
}));

function lookup(key: string): string {
    const value = key.split(".").reduce<unknown>((node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined), dictionary);
    return typeof value === "string" ? value : key;
}

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => (props: Record<string, unknown>) => (
        <Wrapped {...props} languageCode="en-US" resolveLanguageKey={lookup} />
    ),
}));
vi.mock("react-redux", () => ({
    useSelector: (select: (state: unknown) => unknown) => select({authentication: {user: {company: {_id: "c1", name: "Blloku Dental"}}}}),
}));
vi.mock("@coreModule/helpers/context/reloginContext.tsx", () => ({ReloginProvider: ({children}: {children: ReactNode}) => children}));
vi.mock("@coreModule/helpers/hooks/useRelogin.ts", () => ({useRelogin: () => ({triggerRelogin: fixture.relogin, switching: false})}));
vi.mock("@coreModule/clients/panel/private/sidebar/companies/companyUpdatedEvent.ts", () => ({notifyCompanyUpdated: () => undefined}));
vi.mock("@coreModule/helpers/hooks/useHttpRequest.ts", async () => {
    const {useEffect} = await import("react");
    return {
        default: function useHttpRequestFake(request: {method: string}, body: unknown, count: number, _inView: boolean, lifecycle?: {success?: (data: unknown) => void}) {
            const {method} = request;
            const write = method !== "get";
            // Like the real hook: a write goes out once per count, and its success runs after it.
            useEffect(() => {
                if (!write || count === 0) return;
                fixture.writes.push({method, body});
                lifecycle?.success?.({});
            }, [count, write, method, body, lifecycle]);
            if (write) return {loading: false, error: null, data: null};
            return fixture.refused ? {loading: false, error: {status: 403}, data: null} : {loading: false, error: null, data: fixture.state};
        },
    };
});

import SampleCompanyCard from "../sampleCompanyCard.tsx";

const startedAt = "2026-11-23T08:00:00.000Z";

beforeEach(() => {
    localStorage.clear();
    fixture.state = {};
    fixture.refused = false;
    fixture.writes = [];
    fixture.relogin.mockReset();
});

describe("SampleCompanyCard", () => {
    it("offers a sample company named in the viewer's language, and makes it on click", () => {
        render(<SampleCompanyCard />);
        expect(screen.getByText("Try with sample data")).toBeTruthy();
        expect(screen.getByText(/Blloku Dental \(sample\)/)).toBeTruthy();
        fireEvent.click(screen.getByRole("button", {name: "Create sample company"}));
        expect(fixture.writes).toEqual([{method: "put", body: {name: "Blloku Dental (sample)"}}]);
    });

    it("stays hidden for this company once the admin hides the offer", () => {
        render(<SampleCompanyCard />);
        fireEvent.click(screen.getByRole("button", {name: "Hide"}));
        expect(screen.queryByText("Try with sample data")).toBeNull();
        const {container} = render(<SampleCompanyCard />);
        expect(container.querySelector("section")).toBeNull();
    });

    it("shows a sample company being prepared, which can be opened but not yet deleted", () => {
        fixture.state = {sandbox: {_id: "s1", name: "Blloku Dental (sample)", status: "preparing", startedAt}};
        render(<SampleCompanyCard />);
        expect(screen.getByText("Preparing sample data…")).toBeTruthy();
        expect(screen.queryByRole("button", {name: "Delete"})).toBeNull();
        fireEvent.click(screen.getByRole("button", {name: "Open sample company"}));
        expect(fixture.relogin).toHaveBeenCalledWith("s1");
    });

    it("deletes a ready sample company after a confirmation", () => {
        fixture.state = {sandbox: {_id: "s1", name: "Blloku Dental (sample)", status: "ready", startedAt}};
        render(<SampleCompanyCard />);
        expect(screen.getByText("Your sample company is ready.")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", {name: "Delete"}));
        expect(fixture.writes).toEqual([]);
        fireEvent.click(screen.getByRole("button", {name: "Delete sample company"}));
        expect(fixture.writes).toEqual([{method: "delete", body: {_id: "s1"}}]);
    });

    it("inside a sample company, says so and leads back to the real company", () => {
        fixture.state = {parent: {_id: "c0", name: "Blloku Dental"}, sandbox: {_id: "c1", name: "Blloku Dental (sample)", status: "ready", startedAt}};
        render(<SampleCompanyCard />);
        expect(screen.getByText("You are in a sample company")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", {name: "Back to Blloku Dental"}));
        expect(fixture.relogin).toHaveBeenCalledWith("c0");
    });

    it("shows nothing to someone who is not an admin", () => {
        fixture.refused = true;
        const {container} = render(<SampleCompanyCard />);
        expect(container.querySelector("section")).toBeNull();
    });
});
