import {beforeEach, describe, expect, it, vi} from "vitest";
import {MemoryRouter} from "react-router-dom";
import {fireEvent, render, screen} from "@testing-library/react";
import type {HomeSetupStep} from "@coreModule/helpers/types/homeContribution.types.ts";

/* D178: the panel home's setup checklist, with core fixtures (no module's steps). */

const fixture = vi.hoisted(() => ({
    steps: [] as HomeSetupStep[],
    totals: {} as Record<string, number>,
    company: {} as Record<string, unknown>,
    grants: {} as Record<string, {self: {create?: boolean; write?: boolean}}>,
}));

vi.mock("react-redux", () => ({
    useSelector: (select: (state: unknown) => unknown) => select({authentication: {user: {company: {_id: "c1"}}}}),
}));
vi.mock("@coreModule/helpers/context/accessContext.tsx", () => ({
    useAccessMap: () => fixture.grants,
    useAccessHydrated: () => true,
}));
vi.mock("@coreModule/helpers/moduleContributions/loadHomeContributions.ts", () => ({
    getHomeSetupSteps: () => fixture.steps,
}));
vi.mock("@coreModule/helpers/hooks/useHttpRequest.ts", () => ({
    default: (request: {url: string}, _body: unknown, count: number) =>
        count === 0 ? {data: null} : request.url === "/api/company" ? {data: fixture.company} : {data: {total: fixture.totals[request.url] ?? 0}},
}));

import SetupChecklist from "../setupChecklist.tsx";

const dictionary: Record<string, string> = {
    "home.setup.title": "Set up your business",
    "home.setup.progress": "{done} of {total} done",
    "home.setup.hide": "Hide",
    "home.setup.start": "Start",
    "home.setup.done": "Done",
};
const renderChecklist = () => render(
    <MemoryRouter><SetupChecklist resolveLanguageKey={(key: string) => dictionary[key] ?? key} /></MemoryRouter>,
);

const logo: HomeSetupStep = {key: "core.logo", title: "Add your logo", to: "/company/info", accessModel: "companies", doneWhen: {company: (company) => !!company.logo}};
const car: HomeSetupStep = {key: "fixture.car", title: "Add your first car", to: "/cars/create", accessModel: "cars", doneWhen: {list: {url: "/api/cars"}}};
const team: HomeSetupStep = {key: "core.team", title: "Invite your team", to: "/team", accessModel: "users", doneWhen: {list: {url: "/api/users", minTotal: 2}}};

beforeEach(() => {
    localStorage.clear();
    fixture.steps = [logo, car, team];
    fixture.totals = {"/api/cars": 0, "/api/users": 1};
    fixture.company = {logo: "m1"};
    fixture.grants = {companies: {self: {write: true}}, cars: {self: {create: true}}, users: {self: {create: true}}};
});

describe("SetupChecklist", () => {
    it("shows the steps the viewer may do, with what is done", () => {
        renderChecklist();
        expect(screen.getByText("1 of 3 done")).toBeTruthy();
        expect(screen.getAllByRole("link", {name: "Start"}).map((link) => link.getAttribute("href"))).toEqual(["/cars/create", "/team"]);
    });

    it("leaves out a step the viewer may not do", () => {
        fixture.grants = {companies: {self: {write: true}}, cars: {self: {create: false}}, users: {self: {create: true}}};
        renderChecklist();
        expect(screen.queryByText("Add your first car")).toBeNull();
        expect(screen.getByText("1 of 2 done")).toBeTruthy();
    });

    it("shows nothing once every step is done", () => {
        fixture.totals = {"/api/cars": 4, "/api/users": 2};
        const {container} = renderChecklist();
        expect(container.querySelector("section")).toBeNull();
    });

    it("stays hidden for this company once the viewer hides it", () => {
        renderChecklist();
        fireEvent.click(screen.getByRole("button", {name: "Hide"}));
        expect(screen.queryByText("Set up your business")).toBeNull();
        const {container} = renderChecklist();
        expect(container.querySelector("section")).toBeNull();
    });
});
