/**
 * Characterization tests for `EntityCard`.
 *
 * `EntityCard` is rendered by 117 card views and had no coverage, so these pin the contract
 * every one of them relies on: what the render-prop child receives, when the card hides
 * itself, and which dialog each `action` opens.
 *
 * The heavy leaves (action menu, confirm dialogs, DisplayValue) are probes — this file is
 * about EntityCard's own wiring, not theirs.
 */
import {beforeEach, describe, expect, it, vi} from "vitest";
import {act, fireEvent, screen} from "@testing-library/react";
import {createRef} from "react";

/*
 * The harness is pulled in with a top-level `await import` below, never a static import:
 * the `vi.mock` factories await the same module, and a static import deadlocks against them.
 */

/** Lets a test drive the lazy-fetch state the card's loader/error branch switches on. */
const fetchState: {loading: boolean; error: unknown; retry: () => void} = {
    loading: false,
    error: null,
    retry: () => {},
};

vi.mock("@coreModule/helpers/hooks/useEntityCardFetch.ts", () => ({
    useEntityCardFetch: () => fetchState,
}));

/* Spread the original: `LanguageResolveContext` and `resolveTranslationKey` are real exports. */
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    default: (await import("./probes.tsx")).fakeWithLanguage,
}));

vi.mock("@coreModule/components/viewEngine/widgets/actions/menu/actionMenu.tsx", async () => ({
    default: (await import("./probes.tsx")).makeProbe("ActionMenu"),
}));
vi.mock("@coreModule/components/viewEngine/widgets/actions/deleteAction.tsx", async () => ({
    default: (await import("./probes.tsx")).makeProbe("DeleteAction"),
}));
vi.mock("@coreModule/components/viewEngine/widgets/actions/restoreAction.tsx", async () => ({
    default: (await import("./probes.tsx")).makeProbe("RestoreAction"),
}));
vi.mock("@coreModule/components/viewEngine/widgets/display/displayValue.tsx", async () => ({
    default: (await import("./probes.tsx")).makeProbe("DisplayValue"),
}));
vi.mock("@coreModule/components/viewEngine/widgets/display/deletedInfo.tsx", async () => ({
    default: (await import("./probes.tsx")).makeProbe("DeletedInfo"),
}));
vi.mock("@coreModule/components/custom/hiddenElement.tsx", async () => ({
    default: (await import("./probes.tsx")).makeProbe("HiddenElement"),
}));
vi.mock("@coreModule/components/custom/loader/loader.tsx", async () => ({
    default: (await import("./probes.tsx")).makeProbe("Loader"),
}));

const {default: EntityCard} = await import("@coreModule/components/entityPage/list/card/entityCard.tsx");
type CardChildCtx = import("./harness.tsx").CardChildCtx;
type BaseCardProps = import("./harness.tsx").BaseCardProps;
const {
    accessMap,
    baseCardProps,
    entity: makeEntity,
    lastProps,
    propsOf,
    renderWithCardEnv,
    resetCalls,
} = await import("./harness.tsx");

beforeEach(() => {
    resetCalls();
    fetchState.loading = false;
    fetchState.error = null;
    fetchState.retry = () => {};
});

describe("EntityCard access gating", () => {
    it("renders the card body when the resource grants read", () => {
        renderWithCardEnv(
            <EntityCard {...baseCardProps()}>
                {() => <div data-testid="body">body</div>}
            </EntityCard>,
            {access: accessMap("widgets")},
        );
        expect(screen.getByTestId("body")).toBeInTheDocument();
    });

    /* `hasCardRead` denies on `{}` — no granted fields means nothing to show. */
    it("masks the whole card when read grants no fields", () => {
        renderWithCardEnv(
            <EntityCard {...baseCardProps()}>
                {() => <div data-testid="body">body</div>}
            </EntityCard>,
            {access: accessMap("widgets", {read: {}})},
        );
        expect(screen.queryByTestId("body")).not.toBeInTheDocument();
        expect(propsOf("HiddenElement")).toHaveLength(1);
    });

    it("renders nothing for a deleted entity the user cannot restore", () => {
        renderWithCardEnv(
            <EntityCard {...baseCardProps({entity: makeEntity({deletedAt: new Date("2026-01-01")})})}>
                {() => <div data-testid="body">body</div>}
            </EntityCard>,
            {access: accessMap("widgets", {restore: false})},
        );
        expect(screen.queryByTestId("body")).not.toBeInTheDocument();
        expect(propsOf("HiddenElement")).toHaveLength(0);
    });

    it("still renders a deleted entity when the user can restore it", () => {
        renderWithCardEnv(
            <EntityCard {...baseCardProps({entity: makeEntity({deletedAt: new Date("2026-01-01")})})}>
                {() => <div data-testid="body">body</div>}
            </EntityCard>,
            {access: accessMap("widgets", {restore: true})},
        );
        expect(screen.getByTestId("body")).toBeInTheDocument();
    });
});

describe("EntityCard render-prop contract", () => {
    it("hands the child the entity, the read map and both setters", () => {
        let ctx: CardChildCtx | undefined;
        renderWithCardEnv(
            <EntityCard {...baseCardProps()}>
                {(received) => {
                    ctx = received;
                    return <div />;
                }}
            </EntityCard>,
            {access: accessMap("widgets")},
        );
        expect(ctx?.entity).toMatchObject({_id: "entity-1", name: "Alpha"});
        expect(ctx?.read).toBe(true);
        expect(typeof ctx?.setAction).toBe("function");
        expect(typeof ctx?.setEntity).toBe("function");
    });

    it("re-renders the child with the entity a setEntity call installed", () => {
        renderWithCardEnv(
            <EntityCard {...baseCardProps()}>
                {({entity, setEntity}) => (
                    <button
                        data-testid="rename"
                        onClick={() => setEntity({...entity, name: "Beta"})}
                    >
                        {entity.name}
                    </button>
                )}
            </EntityCard>,
            {access: accessMap("widgets")},
        );
        expect(screen.getByTestId("rename")).toHaveTextContent("Alpha");
        fireEvent.click(screen.getByTestId("rename"));
        expect(screen.getByTestId("rename")).toHaveTextContent("Beta");
    });

    it("adopts a changed entity prop", () => {
        const {rerender} = renderWithCardEnv(
            <EntityCard {...baseCardProps()}>
                {({entity}) => <span data-testid="name">{entity.name}</span>}
            </EntityCard>,
            {access: accessMap("widgets")},
        );
        expect(screen.getByTestId("name")).toHaveTextContent("Alpha");
        rerender(
            <EntityCard {...baseCardProps({entity: makeEntity({name: "Gamma"})})}>
                {({entity}) => <span data-testid="name">{entity.name}</span>}
            </EntityCard>,
        );
        expect(screen.getByTestId("name")).toHaveTextContent("Gamma");
    });
});

describe("EntityCard actions", () => {
    /* Typed as the card's own props so callbacks in `extra` infer their context. */
    function openAction(action: string, extra: Partial<BaseCardProps> = {}) {
        renderWithCardEnv(
            <EntityCard {...baseCardProps(extra)}>
                {({setAction}) => (
                    <button data-testid="open" onClick={() => setAction(action)}>
                        open
                    </button>
                )}
            </EntityCard>,
            {access: accessMap("widgets", {restore: true})},
        );
        fireEvent.click(screen.getByTestId("open"));
    }

    it("opens the Sheet with the entity under the configured prop name", () => {
        openAction("view");
        const sheet = lastProps("Sheet");
        expect(sheet.open).toBe(true);
        expect(sheet.entity).toMatchObject({_id: "entity-1"});
    });

    it("opens DeleteAction with the delete url and confirm name", () => {
        openAction("delete");
        const del = lastProps("DeleteAction");
        expect(del.url).toBe("/api/widget");
        expect(del.deleteId).toBe("entity-1");
        expect(del.confirmName).toBe("Alpha");
    });

    it("opens RestoreAction with the restore url", () => {
        openAction("restore");
        expect(lastProps("RestoreAction").url).toBe("/api/widget/restore");
    });

    it("suppresses the delete dialog when hideDelete resolves true for the entity", () => {
        openAction("delete", {hideDelete: () => true});
        expect(propsOf("DeleteAction")).toHaveLength(0);
    });

    it("renders extraDialogs for a custom action", () => {
        openAction("archive", {
            extraDialogs: ({action}) =>
                action === "archive" ? <div data-testid="archive-dialog" /> : null,
        });
        expect(screen.getByTestId("archive-dialog")).toBeInTheDocument();
    });
});

describe("EntityCard lazy fetch", () => {
    it("swaps the card for a loader while the single-row request is in flight", () => {
        fetchState.loading = true;
        renderWithCardEnv(
            <EntityCard {...baseCardProps({fetchId: "x", singleUrl: "/api/widget/single"})}>
                {() => <div data-testid="body">body</div>}
            </EntityCard>,
            {access: accessMap("widgets")},
        );
        expect(screen.queryByTestId("body")).not.toBeInTheDocument();
        expect(propsOf("Loader")).toHaveLength(1);
    });

    /*
     * C1 regression. `extraDialogs` is handed `retry`, so a dialog can refresh the card after
     * mutating it. The fetch guard used to wrap the dialogs as well as the shell, so that retry
     * unmounted the dialog that called it — losing its form state mid-interaction.
     */
    it("keeps an open dialog mounted while a retry is in flight", () => {
        /* A fresh element each time: re-rendering the same element reference makes React bail
           out of the subtree, so the loading flag would never be read back. */
        const tree = () => (
            <EntityCard
                {...baseCardProps({
                    fetchId: "x",
                    singleUrl: "/api/widget/single",
                    extraDialogs: ({action}) =>
                        action === "archive" ? <div data-testid="archive-dialog" /> : null,
                })}
            >
                {({setAction}) => (
                    <button data-testid="open" onClick={() => setAction("archive")}>
                        open
                    </button>
                )}
            </EntityCard>
        );

        const {rerender} = renderWithCardEnv(tree(), {access: accessMap("widgets")});
        fireEvent.click(screen.getByTestId("open"));
        expect(screen.getByTestId("archive-dialog")).toBeInTheDocument();

        /* The dialog calls retry(); the card starts loading again. */
        fetchState.loading = true;
        rerender(tree());

        expect(screen.getByTestId("archive-dialog")).toBeInTheDocument();
    });
});

describe("EntityCard imperative handle", () => {
    it("installs the entity a withAxios lifecycle reports", () => {
        const ref = createRef<{success: (data: unknown) => void} | null>();
        renderWithCardEnv(
            <EntityCard {...baseCardProps({innerRef: ref})}>
                {({entity}) => <span data-testid="name">{entity.name}</span>}
            </EntityCard>,
            {access: accessMap("widgets")},
        );
        expect(screen.getByTestId("name")).toHaveTextContent("Alpha");
        act(() => ref.current?.success(makeEntity({name: "Delta"})));
        expect(screen.getByTestId("name")).toHaveTextContent("Delta");
    });
});
