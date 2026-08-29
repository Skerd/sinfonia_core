import {act, render} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {StudioDraftProvider, useStudioDrafts} from "./studioDraftProvider.tsx";

/**
 * Undo used to step one keystroke at a time, because every inspector `onChange` pushed a
 * history entry. These cases pin the coalescing that replaces that.
 */

function config(name: string): ViewConfig {
    return {
        model: "warehouses",
        viewType: "sheet",
        accessModel: "warehouses",
        apiUrl: "/api/x",
        nodes: [{render: "#DisplayCard", field: {name, widget: "#DisplayCard"}}],
    };
}

type Api = ReturnType<typeof useStudioDrafts>;

function mountProvider(): () => Api {
    let latest: Api;
    function Probe() {
        latest = useStudioDrafts();
        return null;
    }
    render(
        <StudioDraftProvider>
            <Probe />
        </StudioDraftProvider>,
    );
    return () => latest;
}

function boundName(api: Api): string | undefined {
    return api.getViewDraft("warehouses", "sheet")?.nodes[0]?.field?.name;
}

beforeEach(() => {
    localStorage.clear();
});

describe("undo coalescing", () => {
    it("collapses a run of edits from the same control into one undo step", () => {
        const api = mountProvider();

        act(() => {
            for (const value of ["n", "na", "nam", "name"]) {
                api().setViewDraft("warehouses", "sheet", config(value), {
                    coalesceKey: "0:field.name",
                });
            }
        });
        expect(boundName(api())).toBe("name");

        act(() => api().undo());
        /* One undo, and the whole edit is gone — not just the last character. */
        expect(api().getViewDraft("warehouses", "sheet")).toBeUndefined();
    });

    it("starts a new undo entry when the edited control changes", () => {
        const api = mountProvider();

        act(() => {
            api().setViewDraft("warehouses", "sheet", config("a"), {coalesceKey: "0:field.name"});
        });
        act(() => {
            api().setViewDraft("warehouses", "sheet", config("b"), {coalesceKey: "0:field.label"});
        });

        act(() => api().undo());
        expect(boundName(api())).toBe("a");
    });

    it("never coalesces a commit with no key, so structural edits always push", () => {
        const api = mountProvider();

        act(() => {
            api().setViewDraft("warehouses", "sheet", config("a"));
            api().setViewDraft("warehouses", "sheet", config("b"));
        });

        act(() => api().undo());
        expect(boundName(api())).toBe("a");
    });

    it("does not let a keyed commit merge into an unkeyed one", () => {
        const api = mountProvider();

        act(() => {
            api().setViewDraft("warehouses", "sheet", config("a"));
        });
        act(() => {
            api().setViewDraft("warehouses", "sheet", config("b"), {coalesceKey: "0:field.name"});
        });

        act(() => api().undo());
        expect(boundName(api())).toBe("a");
    });

    it("breaks the run after an undo, so redo then edit does not rewrite history", () => {
        const api = mountProvider();

        act(() => {
            api().setViewDraft("warehouses", "sheet", config("a"), {coalesceKey: "0:field.name"});
        });
        act(() => api().undo());
        act(() => {
            api().setViewDraft("warehouses", "sheet", config("b"), {coalesceKey: "0:field.name"});
        });
        act(() => api().undo());
        expect(api().getViewDraft("warehouses", "sheet")).toBeUndefined();
    });

    it("still reports that undo is available after a coalesced run", () => {
        const api = mountProvider();
        act(() => {
            api().setViewDraft("warehouses", "sheet", config("a"), {coalesceKey: "k"});
            api().setViewDraft("warehouses", "sheet", config("ab"), {coalesceKey: "k"});
        });
        expect(api().canUndo).toBe(true);
    });
});

describe("persistence", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it("writes once after typing settles, not once per keystroke", () => {
        vi.useFakeTimers();
        const setItem = vi.spyOn(Storage.prototype, "setItem");
        const api = mountProvider();

        act(() => {
            for (const value of ["n", "na", "nam", "name"]) {
                api().setViewDraft("warehouses", "sheet", config(value), {
                    coalesceKey: "0:field.name",
                });
            }
        });
        /* Four commits, nothing written yet. */
        expect(setItem).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(400);
        });
        expect(setItem).toHaveBeenCalledTimes(1);
    });

    it("surfaces a quota failure instead of losing the work silently", () => {
        vi.useFakeTimers();
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new DOMException("QuotaExceededError");
        });
        const api = mountProvider();

        act(() => {
            api().setViewDraft("warehouses", "sheet", config("a"));
        });
        expect(api().persistError).toBeNull();

        act(() => {
            vi.advanceTimersByTime(400);
        });
        expect(api().persistError).toMatch(/Quota/i);
        /* The draft is still usable in memory — it just is not durable. */
        expect(boundName(api())).toBe("a");
    });

    it("clears the error once a later write succeeds", () => {
        vi.useFakeTimers();
        const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
            throw new DOMException("QuotaExceededError");
        });
        const api = mountProvider();

        act(() => {
            api().setViewDraft("warehouses", "sheet", config("a"));
        });
        act(() => {
            vi.advanceTimersByTime(400);
        });
        expect(api().persistError).toBeTruthy();

        act(() => {
            api().setViewDraft("warehouses", "sheet", config("b"));
        });
        act(() => {
            vi.advanceTimersByTime(400);
        });
        expect(api().persistError).toBeNull();
        expect(setItem).toHaveBeenCalledTimes(2);
    });
});
