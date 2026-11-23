import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import type {ComponentType} from "react";
import {MemoryRouter, useLocation} from "react-router-dom";
import type {HomeSetupStep, HomeTourStop} from "@coreModule/helpers/types/homeContribution.types.ts";

/* D179: the guided first run's runner, on fixture steps (no module's). */

const fixture = vi.hoisted(() => ({
    steps: [] as HomeSetupStep[],
    tour: [] as HomeTourStop[],
    done: {} as Record<string, boolean>,
    next: undefined as string | undefined,
}));

vi.mock("react-redux", async (importOriginal) => ({
    ...await importOriginal<object>(),
    useSelector: (select: (state: unknown) => unknown) => select({authentication: {user: {id: "u1", company: {_id: "c1", name: "Adriatic Smiles"}}}}),
}));
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key} />,
}));
vi.mock("@coreModule/helpers/context/accessContext.tsx", () => ({
    useAccessMap: () => ({cars: {self: {create: true, read: true}}, users: {self: {create: true}}}),
    useAccessHydrated: () => true,
}));
vi.mock("@coreModule/helpers/moduleContributions/loadHomeContributions.ts", () => ({
    getHomeSetupSteps: () => fixture.steps,
    getHomeTour: () => fixture.tour,
}));
vi.mock("../../setupStepStatus.ts", async (importOriginal) => ({
    ...await importOriginal<object>(),
    isStepDone: async (step: HomeSetupStep) => fixture.done[step.key] ?? false,
    nextOpenStep: async (steps: HomeSetupStep[]) => steps.find((step) => step.key === fixture.next),
}));

import {GuideProvider} from "../guideContext.tsx";
import GuideRunner from "../guideRunner.tsx";
import {writeGuideRun, type GuideRun} from "../guideRun.ts";
import {PageHelp, type PageHelpContent} from "@coreModule/components/custom/pageHelp.tsx";
import {MobileOverrideContext} from "@coreModule/helpers/hooks/useMobile.tsx";

const car: HomeSetupStep = {
    key: "fixture.car", title: "Add your first car", to: "/cars/create", accessModel: "cars", doneWhen: {list: {url: "/api/cars"}},
    guide: [{target: "field.name", title: "Name it", text: "As customers see it."}, {target: "form.save", title: "Save", text: "Save it."}],
};
const team: HomeSetupStep = {key: "core.team", title: "Invite your team", to: "/team", accessModel: "users", doneWhen: {list: {url: "/api/users"}}};

/** Where the router is, so a test can see the runner move the person. */
function Location() {
    return <output data-testid="location">{useLocation().pathname}</output>;
}

function renderAt(path: string, run: GuideRun | null) {
    writeGuideRun(run);
    return render(
        <MemoryRouter initialEntries={[path]}>
            <GuideProvider>
                <input data-tour="field.name" aria-label="Name" />
                <button type="submit" data-tour="form.save">Add</button>
                <a href="/cars" data-tour="nav:/cars">Cars</a>
                <button type="button" data-tour="page.help">Help</button>
                <Location />
                <GuideRunner />
            </GuideProvider>
        </MemoryRouter>,
    );
}

const carsHelp: PageHelpContent = {
    ariaLabel: "About cars", title: "About cars", overview: "Every car you rent out.",
    sections: [{title: "On this page", items: ["Retire a car instead of deleting it."]}],
};
const homeHelp: PageHelpContent = {ariaLabel: "About home", title: "About home", overview: "Your day at a glance.", sections: []};

/** A panel whose pages each show their own ⓘ: the cars list, and every other page its home help. */
function HelpPages() {
    return <PageHelp help={useLocation().pathname === "/cars" ? carsHelp : homeHelp} />;
}

function renderPagesAt(path: string, run: GuideRun) {
    writeGuideRun(run);
    return render(
        <MemoryRouter initialEntries={[path]}>
            <GuideProvider>
                <HelpPages />
                <Location />
                <GuideRunner />
            </GuideProvider>
        </MemoryRouter>,
    );
}

const storedRun = (): unknown => JSON.parse(sessionStorage.getItem("panel_guide_run") ?? "null");

beforeAll(() => {
    // jsdom lays nothing out: every element gets a box, so the runner sees it.
    Element.prototype.getBoundingClientRect = () => ({x: 0, y: 0, top: 0, left: 0, right: 120, bottom: 24, width: 120, height: 24, toJSON: () => ({})});
    Element.prototype.scrollIntoView = () => undefined;
});

beforeEach(() => {
    sessionStorage.clear();
    fixture.steps = [car, team];
    fixture.tour = [];
    fixture.done = {};
    fixture.next = undefined;
});

afterEach(() => {
    vi.useRealTimers();
});

describe("GuideRunner (D179)", () => {
    it("shows a step's tips on its page in order, outlining each element, then waits for the save", async () => {
        renderAt("/cars/create", {kind: "step", companyId: "c1", stepKey: "fixture.car", tip: 0, seenPage: false});

        expect(await screen.findByRole("heading", {name: "Name it"})).toBeTruthy();
        expect(screen.getByLabelText("Name").className).toContain("ring-2");
        fireEvent.click(screen.getByRole("button", {name: "home.guide.next"}));

        expect(await screen.findByRole("heading", {name: "Save"})).toBeTruthy();
        expect(screen.getByLabelText("Name").className).not.toContain("ring-2");
        fireEvent.click(screen.getByRole("button", {name: "home.guide.gotIt"}));

        await waitFor(() => expect(screen.queryByRole("heading", {name: "Save"})).toBeNull());
        // Still running: leaving the page will check the step.
        expect(storedRun()).toMatchObject({kind: "step", stepKey: "fixture.car", tip: 2, seenPage: true});
    });

    it("carries on from the saved tip after a reload", async () => {
        renderAt("/cars/create", {kind: "step", companyId: "c1", stepKey: "fixture.car", tip: 1, seenPage: true});
        expect(await screen.findByRole("heading", {name: "Save"})).toBeTruthy();
    });

    it("skips a tip whose element never shows", async () => {
        vi.useFakeTimers({shouldAdvanceTime: true});
        fixture.steps = [{...car, guide: [{target: "field.gone", title: "Gone", text: "-"}, ...car.guide!]}];
        renderAt("/cars/create", {kind: "step", companyId: "c1", stepKey: "fixture.car", tip: 0, seenPage: true});

        await act(async () => {
            vi.advanceTimersByTime(4500);
        });
        expect(await screen.findByRole("heading", {name: "Name it"})).toBeTruthy();
        expect(screen.queryByRole("heading", {name: "Gone"})).toBeNull();
    });

    it("ends the guide on Skip", async () => {
        renderAt("/cars/create", {kind: "step", companyId: "c1", stepKey: "fixture.car", tip: 0, seenPage: false});
        fireEvent.click(await screen.findByRole("button", {name: "home.guide.skip"}));
        await waitFor(() => expect(screen.queryByRole("heading", {name: "Name it"})).toBeNull());
        expect(storedRun()).toBeNull();
    });

    it("once the step's page is left with the step done, offers the next open step and opens it", async () => {
        fixture.done = {"fixture.car": true};
        fixture.next = "core.team";
        renderAt("/cars/42", {kind: "step", companyId: "c1", stepKey: "fixture.car", tip: 2, seenPage: true});

        expect(await screen.findByRole("dialog", {name: "home.guide.stepDone"})).toBeTruthy();
        fireEvent.click(screen.getByRole("button", {name: "home.guide.goNext"}));

        expect(screen.getByTestId("location").textContent).toBe("/team");
        expect(storedRun()).toMatchObject({kind: "step", stepKey: "core.team", tip: 0});
    });

    it("says a step is not finished yet, and still offers the next one", async () => {
        fixture.next = "core.team";
        renderAt("/somewhere", {kind: "step", companyId: "c1", stepKey: "fixture.car", tip: 2, seenPage: true});
        expect(await screen.findByRole("dialog", {name: "home.guide.stepOpen"})).toBeTruthy();
    });

    it("ends quietly when the step is left unfinished and nothing else is open", async () => {
        renderAt("/somewhere", {kind: "step", companyId: "c1", stepKey: "fixture.car", tip: 2, seenPage: true});
        await waitFor(() => expect(storedRun()).toBeNull());
        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("offers the tour once setup is done, and the tour ends at the page help of the last page it named", async () => {
        fixture.done = {"fixture.car": true};
        fixture.tour = [{target: "nav:/cars", title: "Your cars", text: "Every car you rent out."}];
        renderAt("/cars/42", {kind: "step", companyId: "c1", stepKey: "fixture.car", tip: 2, seenPage: true});

        expect(await screen.findByRole("dialog", {name: "home.guide.allDoneTitle"})).toBeTruthy();
        fireEvent.click(screen.getByRole("button", {name: "home.guide.takeTour"}));

        expect(await screen.findByRole("heading", {name: "Your cars"})).toBeTruthy();
        fireEvent.click(screen.getByRole("button", {name: "home.guide.next"}));

        expect(await screen.findByRole("heading", {name: "home.guide.helpTitle"})).toBeTruthy();
        expect(screen.getByTestId("location").textContent).toBe("/cars");
        fireEvent.click(screen.getByRole("button", {name: "home.guide.finish"}));
        await waitFor(() => expect(storedRun()).toBeNull());
    });

    it("opens a page stop's page and explains it with that page's own help, not the help of the page being left (D180)", async () => {
        fixture.tour = [{page: "/cars", accessModel: "cars"}];
        renderPagesAt("/", {kind: "tour", companyId: "c1", stop: 0});

        expect(await screen.findByRole("heading", {name: "About cars"})).toBeTruthy();
        expect(screen.getByTestId("location").textContent).toBe("/cars");
        expect(screen.getByText("Every car you rent out.")).toBeTruthy();
        expect(screen.getByRole("heading", {name: "On this page"})).toBeTruthy();
        expect(screen.getByText("Retire a car instead of deleting it.")).toBeTruthy();
        expect(screen.queryByRole("heading", {name: "About home"})).toBeNull();

        // Then the closing tip, at the same page's ⓘ.
        fireEvent.click(screen.getByRole("button", {name: "home.guide.next"}));
        expect(await screen.findByRole("heading", {name: "home.guide.helpTitle"})).toBeTruthy();
    });

    it("leaves out a page stop the viewer may not read", async () => {
        fixture.tour = [{page: "/vault", accessModel: "vaults"}, {page: "/cars", accessModel: "cars"}];
        renderPagesAt("/", {kind: "tour", companyId: "c1", stop: 0});
        expect(await screen.findByRole("heading", {name: "About cars"})).toBeTruthy();
        // Kept, it would have opened /vault first and shown that page's help.
        expect(screen.getByTestId("location").textContent).toBe("/cars");
    });

    it("leaves the sidebar's stops out on a phone, where the sidebar stays closed", async () => {
        fixture.tour = [{target: "nav:/cars", title: "Your cars", text: "Every car."}, {page: "/cars", accessModel: "cars"}];
        writeGuideRun({kind: "tour", companyId: "c1", stop: 0});
        render(
            <MobileOverrideContext value>
                <MemoryRouter initialEntries={["/"]}>
                    <GuideProvider>
                        <a href="/cars" data-tour="nav:/cars">Cars</a>
                        <HelpPages />
                        <GuideRunner />
                    </GuideProvider>
                </MemoryRouter>
            </MobileOverrideContext>,
        );
        expect(await screen.findByRole("heading", {name: "About cars"})).toBeTruthy();
        expect(screen.queryByRole("heading", {name: "Your cars"})).toBeNull();
    });

    it("does nothing for a run from another company", () => {
        renderAt("/cars/create", {kind: "step", companyId: "other", stepKey: "fixture.car", tip: 0, seenPage: false});
        expect(screen.queryByRole("heading", {name: "Name it"})).toBeNull();
    });
});
