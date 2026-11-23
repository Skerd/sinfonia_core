import {beforeEach, describe, expect, it, vi} from "vitest";
import {MemoryRouter} from "react-router-dom";
import {fireEvent, render, screen} from "@testing-library/react";
import type {HomeSetupStep} from "@coreModule/helpers/types/homeContribution.types.ts";

/* D178: the panel home's setup checklist, with core fixtures (no module's steps); D179: its welcome and step starts. */

const fixture = vi.hoisted(() => ({
    steps: [] as HomeSetupStep[],
    totals: {} as Record<string, number>,
    company: {} as Record<string, unknown>,
    grants: {} as Record<string, {self: {create?: boolean; write?: boolean}}>,
    startStep: vi.fn(),
    navigate: vi.fn(),
}));

vi.mock("react-redux", async (importOriginal) => ({
    ...await importOriginal<object>(),
    useSelector: (select: (state: unknown) => unknown) => select({authentication: {user: {id: "u1", company: {_id: "c1", name: "Adriatic Smiles"}}}}),
}));
vi.mock("react-router-dom", async (importOriginal) => ({...await importOriginal<object>(), useNavigate: () => fixture.navigate}));
// The guide's done checks call the API; the checklist itself uses `useHttpRequest` (mocked below).
vi.mock("@coreModule/helpers/apiClient/requestFromApi.ts", () => ({requestFromApi: vi.fn()}));
vi.mock("../guide/guideContext.tsx", () => ({useGuide: () => ({startStep: fixture.startStep})}));
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
    "home.guide.welcomeTitle": "Welcome to {company}",
    "home.guide.welcomeText": "Let's get {company} ready.",
    "home.guide.welcomeStart": "Let's start",
    "home.guide.later": "Later",
};
const WELCOME_SEEN = "panel_guide_welcome_seen_c1_u1";
const renderChecklist = () => render(
    <MemoryRouter><SetupChecklist resolveLanguageKey={(key: string) => dictionary[key] ?? key} /></MemoryRouter>,
);

const logo: HomeSetupStep = {key: "core.logo", title: "Add your logo", to: "/company/info", accessModel: "companies", doneWhen: {company: (company) => !!company.logo}};
const car: HomeSetupStep = {key: "fixture.car", title: "Add your first car", to: "/cars/create", accessModel: "cars", doneWhen: {list: {url: "/api/cars"}}};
const team: HomeSetupStep = {key: "core.team", title: "Invite your team", to: "/team", accessModel: "users", doneWhen: {list: {url: "/api/users", minTotal: 2}}};

beforeEach(() => {
    localStorage.clear();
    // The welcome is its own case below; elsewhere it has been seen, so the checklist is not behind a dialog.
    localStorage.setItem(WELCOME_SEEN, "1");
    fixture.startStep.mockReset();
    fixture.navigate.mockReset();
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

    it("starts a step's guide when the viewer opens it (D179)", () => {
        renderChecklist();
        fireEvent.click(screen.getAllByRole("link", {name: "Start"})[0]);
        expect(fixture.startStep).toHaveBeenCalledWith("fixture.car");
    });
});

describe("SetupChecklist welcome (D179)", () => {
    beforeEach(() => localStorage.removeItem(WELCOME_SEEN));

    it("welcomes a business with most of its setup ahead, once, and starts the first open step", () => {
        fixture.company = {};
        renderChecklist();
        expect(screen.getByRole("dialog", {name: "Welcome to Adriatic Smiles"})).toBeTruthy();
        // The open steps, in order.
        expect(screen.getAllByRole("listitem").map((item) => item.textContent).slice(-3)).toEqual(["Add your logo", "Add your first car", "Invite your team"]);

        fireEvent.click(screen.getByRole("button", {name: "Let's start"}));
        expect(fixture.startStep).toHaveBeenCalledWith("core.logo");
        expect(fixture.navigate).toHaveBeenCalledWith("/company/info");
        expect(localStorage.getItem(WELCOME_SEEN)).toBe("1");
    });

    it("does not welcome again once dismissed", () => {
        fixture.company = {};
        renderChecklist();
        fireEvent.click(screen.getByRole("button", {name: "Later"}));
        expect(screen.queryByRole("dialog")).toBeNull();
        renderChecklist();
        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("does not welcome a business with most of its setup done", () => {
        fixture.totals = {"/api/cars": 3, "/api/users": 1};
        renderChecklist();
        expect(screen.getByText("2 of 3 done")).toBeTruthy();
        expect(screen.queryByRole("dialog")).toBeNull();
    });
});
