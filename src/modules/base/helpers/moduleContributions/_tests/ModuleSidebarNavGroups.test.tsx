import {render, screen} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {NavGroup} from "@baseModule/helpers/types/sidebarNav.types.ts";
import type {ResolveLanguageKey} from "@baseModule/helpers/hocs/withLanguage.tsx";

const state = vi.hoisted(() => ({
    access: {} as Record<string, unknown>,
    hydrated: true as boolean | null,
    getGroups: vi.fn(),
}));

vi.mock("@baseModule/helpers/context/accessContext.tsx", () => ({
    useAccessMap: () => state.access,
    useAccessHydrated: () => state.hydrated,
}));
vi.mock("@baseModule/helpers/moduleContributions/loadSidebarContributions.ts", () => ({
    getModuleSidebarNavGroups: state.getGroups,
}));
vi.mock("@baseModule/components/navigation/navGroup.tsx", () => ({
    NavGroup: ({title, items}: {title: string; items: unknown[]}) => <section aria-label={title}>{items.length}</section>,
}));

const {ModuleSidebarNavGroups} = await import("@baseModule/helpers/moduleContributions/ModuleSidebarNavGroups.tsx");

const link = (title: string, permissions: string[] = []) => ({
    title, url: `/${title}`, permissions, usersPermissions: [], atLeastOnePermission: true,
});
const group = (title: string, permissions: string[] = [], items = [link(`${title}-link`)]): NavGroup => ({
    title, items, permissions, usersPermissions: [], atLeastOnePermission: true,
});
const resolve = ((key: string) => key) as ResolveLanguageKey;
const sectionTitles = () => screen.queryAllByRole("region").map((el) => el.getAttribute("aria-label"));

beforeEach(() => {
    state.access = {};
    state.hydrated = true;
    state.getGroups.mockReset();
    state.getGroups.mockReturnValue([group("Public"), group("Orders", ["orders"])]);
});

describe("ModuleSidebarNavGroups", () => {
    it("passes the counts to the loader, defaulting them to 0", () => {
        render(<ModuleSidebarNavGroups resolveLanguageKey={resolve} />);
        expect(state.getGroups).toHaveBeenCalledWith(resolve, {chatUnreadTotal: 0, publicChatWaitingCount: 0, publicChatMineUnread: 0});

        render(<ModuleSidebarNavGroups resolveLanguageKey={resolve} chatUnreadTotal={2} publicChatWaitingCount={3} publicChatMineUnread={4} />);
        expect(state.getGroups).toHaveBeenLastCalledWith(resolve, {chatUnreadTotal: 2, publicChatWaitingCount: 3, publicChatMineUnread: 4});
    });

    it("hides groups the user cannot read", () => {
        render(<ModuleSidebarNavGroups resolveLanguageKey={resolve} />);
        expect(sectionTitles()).toEqual(["Public"]);
    });

    it("shows readable groups", () => {
        state.access = {orders: {self: {read: true}}};
        render(<ModuleSidebarNavGroups resolveLanguageKey={resolve} />);
        expect(sectionTitles()).toEqual(["Public", "Orders"]);
    });

    it("shows everything while access is loading", () => {
        state.hydrated = false;
        render(<ModuleSidebarNavGroups resolveLanguageKey={resolve} />);
        expect(sectionTitles()).toEqual(["Public", "Orders"]);
    });

    it("drops groups whose entries are all hidden", () => {
        state.getGroups.mockReturnValue([group("Mixed", [], [link("secret", ["invoices"])])]);
        render(<ModuleSidebarNavGroups resolveLanguageKey={resolve} />);
        expect(sectionTitles()).toEqual([]);
    });

    it("renders nothing when no module contributes", () => {
        state.getGroups.mockReturnValue([]);
        const {container} = render(<ModuleSidebarNavGroups resolveLanguageKey={resolve} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("renders groups that share a title", () => {
        state.getGroups.mockReturnValue([group("Same"), group("Same")]);
        render(<ModuleSidebarNavGroups resolveLanguageKey={resolve} />);
        expect(sectionTitles()).toEqual(["Same", "Same"]);
    });

    it("recomputes only when an input changes", () => {
        const {rerender} = render(<ModuleSidebarNavGroups resolveLanguageKey={resolve} chatUnreadTotal={1} />);
        rerender(<ModuleSidebarNavGroups resolveLanguageKey={resolve} chatUnreadTotal={1} />);
        expect(state.getGroups).toHaveBeenCalledTimes(1);

        rerender(<ModuleSidebarNavGroups resolveLanguageKey={resolve} chatUnreadTotal={2} />);
        expect(state.getGroups).toHaveBeenCalledTimes(2);

        rerender(<ModuleSidebarNavGroups resolveLanguageKey={((key: string) => key) as ResolveLanguageKey} chatUnreadTotal={2} />);
        expect(state.getGroups).toHaveBeenCalledTimes(3);
    });
});
