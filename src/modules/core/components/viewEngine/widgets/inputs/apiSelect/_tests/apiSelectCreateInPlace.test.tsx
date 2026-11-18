import type {ComponentType, FormEvent, ReactNode} from "react";
import {lazy} from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {type CachedViewConfigs, ViewConfigContext} from "@coreModule/helpers/context/viewConfigContext.tsx";
import {DialogDescription, DialogTitle} from "@coreModule/components/ui/dialog.tsx";
import type {GenericCreateSurfaceProps} from "@coreModule/components/entityPage/pages/createGenericCreatePage.tsx";
import type {ApiSelectCreateAdapterProps} from "@coreModule/components/viewEngine/widgets/inputs/apiSelect/createFromSearchTypes.ts";

const DICTIONARY: Record<string, string> = {createNewModel: "Create new '{}'", createNew: "Create new", fixtureUser: "New fixture user"};
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Inner: ComponentType<Record<string, unknown>>) => (props: Record<string, unknown>) =>
        <Inner resolveLanguageKey={(key: string) => DICTIONARY[key] ?? key} languageCode="en-US" {...props} />,
}));
// The list itself is not under test: an empty, settled page.
vi.mock("@coreModule/helpers/hooks/components/useApiSelectOptions.ts", () => ({
    useApiSelectOptions: () => ({
        options: [], resolvedOptions: [], loading: false, loadingMore: false, page: 1, total: 0, hasMore: false,
        pendingValue: undefined, loadMore: () => undefined, prependCreatedOption: () => undefined,
    }),
}));
const grants = vi.hoisted(() => ({create: new Set<string>(["things", "fixtureUsers"])}));
vi.mock("@coreModule/helpers/hooks/useAccess.ts", () => ({
    useAccess: (model: string) => ({create: grants.create.has(model)}),
}));

/** A stand-in for a module's create page: its own form, saving answers with the new id. */
function ThingCreatePage({onFinished}: GenericCreateSurfaceProps) {
    return (
        <form onSubmit={(e) => {
            e.preventDefault();
            onFinished?.("thing-9");
        }}>
            <button type="submit">save thing</button>
            <button type="button" onClick={() => onFinished?.()}>cancel thing</button>
        </form>
    );
}
const pages = vi.hoisted(() => ({byUrl: {} as Record<string, ComponentType<GenericCreateSurfaceProps>>}));
vi.mock("@coreModule/components/viewEngine/widgetRegistry.ts", () => ({
    getCreatePage: (apiUrl: string) => pages.byUrl[apiUrl],
}));

/** A stand-in for a core adapter (the user form): it still gets the search text and picks with a label. */
function FixtureUserAdapter({onCreated}: ApiSelectCreateAdapterProps) {
    return (
        <>
            <DialogTitle>New user</DialogTitle>
            <DialogDescription>Invite a teammate</DialogDescription>
            <button type="button" onClick={() => onCreated("user-3", "Arta Hoxha")}>save user</button>
        </>
    );
}
vi.mock("@coreModule/components/viewEngine/widgets/inputs/apiSelect/createFromSearchRegistry.ts", () => ({
    API_SELECT_CREATE_ADAPTERS: {FixtureUser: FixtureUserAdapter},
    API_SELECT_CREATE_ADAPTER_BY_API_URL: {"/api/fixture/users/select": "FixtureUser"},
    API_SELECT_INLINE_CREATE_FALLBACK_LABEL_KEY_BY_API_URL: {"/api/fixture/users/select": "fixtureUser"},
}));

const {ApiSelect} = await import("@coreModule/components/viewEngine/widgets/inputs/apiSelect/apiSelect.tsx");

const THING_URL = "/api/test/thing";
const configs: Record<string, CachedViewConfigs> = {
    things: {"form:create": {model: "things", viewType: "form", viewMode: "create", accessModel: "things", apiUrl: THING_URL, nodes: []} as ViewConfig},
};

function Host({children, onOuterSubmit}: {children: ReactNode; onOuterSubmit?: (e: FormEvent) => void}) {
    return (
        <ViewConfigContext.Provider value={{configs, isHydrated: true}}>
            <form onSubmit={(e) => {
                e.preventDefault();
                onOuterSubmit?.(e);
            }}>
                {children}
            </form>
        </ViewConfigContext.Provider>
    );
}

type SelectProps = Partial<{apiUrl: string; multiple: boolean; value: string | string[]; disabled: boolean; forTable: boolean}>;

function renderSelect(props: SelectProps = {}, onOuterSubmit?: (e: FormEvent) => void) {
    const onValueChange = vi.fn();
    render(
        <Host onOuterSubmit={onOuterSubmit}>
            <ApiSelect apiUrl={`${THING_URL}/select`} value="" onValueChange={onValueChange} inlineCreateEntityLabel="Thing" {...props} />
        </Host>,
    );
    return {onValueChange};
}

/** The button sits in the open dropdown, under its list. */
function openDropdown() {
    fireEvent.click(screen.getByRole("combobox"));
}
const createButton = () => screen.queryByRole("button", {name: "Create new 'Thing'"});

describe("ApiSelect create in place", () => {
    afterEach(() => {
        pages.byUrl = {};
        grants.create = new Set(["things", "fixtureUsers"]);
    });

    it("offers 'Create new' under the dropdown's list and picks the record its create page saves", async () => {
        pages.byUrl = {[THING_URL]: lazy(async () => ({default: ThingCreatePage}))};
        const onOuterSubmit = vi.fn();
        const {onValueChange} = renderSelect({}, onOuterSubmit);

        expect(createButton()).toBeNull();
        openDropdown();
        fireEvent.click(createButton()!);
        const dialog = await screen.findByRole("dialog");
        expect(dialog.textContent).toContain("Create new 'Thing'");
        fireEvent.click(await screen.findByText("save thing"));

        expect(onValueChange).toHaveBeenCalledWith("thing-9", undefined, undefined);
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
        // The dialog is portalled but React bubbles its submit up the tree: the form around the select must not save.
        expect(onOuterSubmit).not.toHaveBeenCalled();
    });

    it("adds the new record to a multi-select's values", async () => {
        pages.byUrl = {[THING_URL]: ThingCreatePage};
        const {onValueChange} = renderSelect({multiple: true, value: ["a"]});

        openDropdown();
        fireEvent.click(createButton()!);
        fireEvent.click(await screen.findByText("save thing"));

        expect(onValueChange.mock.calls.at(-1)?.[0]).toEqual(["a", "thing-9"]);
    });

    it("closes without picking when the page is cancelled", async () => {
        pages.byUrl = {[THING_URL]: ThingCreatePage};
        const {onValueChange} = renderSelect();

        openDropdown();
        fireEvent.click(createButton()!);
        fireEvent.click(await screen.findByText("cancel thing"));

        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
        expect(onValueChange).not.toHaveBeenCalled();
    });

    it("keeps a core adapter (users) on the same button", async () => {
        grants.create = new Set(["fixtureUsers"]);
        const onValueChange = vi.fn();
        render(
            <Host>
                <ApiSelect
                    apiUrl="/api/fixture/users/select"
                    createFromSearch={{accessModel: "fixtureUsers"}}
                    value=""
                    onValueChange={onValueChange}
                />
            </Host>,
        );

        openDropdown();
        fireEvent.click(screen.getByRole("button", {name: "New fixture user"}));
        fireEvent.click(await screen.findByText("save user"));

        expect(onValueChange).toHaveBeenCalledWith("user-3", "Arta Hoxha", undefined);
    });

    it.each<[string, SelectProps, () => void]>([
        ["in a list filter", {forTable: true}, () => undefined],
        ["while the select is disabled", {disabled: true}, () => undefined],
        ["without the create grant", {}, () => {
            grants.create = new Set();
        }],
        ["when the model has no create form", {apiUrl: "/api/test/other/select"}, () => {
            pages.byUrl["/api/test/other"] = ThingCreatePage;
        }],
    ])("is not offered %s", (_label, props, arrange) => {
        pages.byUrl = {[THING_URL]: ThingCreatePage};
        arrange();
        renderSelect(props);
        openDropdown();
        expect(createButton()).toBeNull();
    });

    it("is not offered when no module contributes a create page", () => {
        renderSelect();
        openDropdown();
        expect(createButton()).toBeNull();
    });
});
