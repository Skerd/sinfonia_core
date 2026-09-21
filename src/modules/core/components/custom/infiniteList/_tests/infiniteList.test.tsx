import {render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";
import type {ReactNode} from "react";
import useIsInViewport from "@coreModule/helpers/hooks/useIsInViewport.ts";
import InfiniteList, {InfiniteListProps} from "@coreModule/components/custom/infiniteList";
import {LanguageResolveContext} from "@coreModule/helpers/hocs/withLanguage.tsx";

// The sentinel's visibility is the only browser-dependent input; driving it directly keeps these
// tests about the list's own states.
vi.mock("@coreModule/helpers/hooks/useIsInViewport.ts", () => ({default: vi.fn(() => false)}));
const setInView = (value: boolean) => vi.mocked(useIsInViewport).mockReturnValue(value);

// `Loader`, `SimpleError` and the widgets they render are all `withLanguage`-wrapped, which pulls
// in the redux store. Replacing the HOC (but keeping the real `LanguageResolveContext`, which this
// component reads) takes the dictionary loader out of the tree in one go.
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", async (importActual) => ({
    ...(await importActual<Record<string, unknown>>()),
    default:
        () =>
        (Component: (props: Record<string, unknown>) => unknown) =>
        (props: Record<string, unknown>) =>
            Component({...props, resolveLanguageKey: (k: string) => k, resolveLanguageValue: () => null}),
}));

type Item = {_id: string; label: string};

const page = (from: number, count: number, total: number) => ({
    data: Array.from({length: count}, (_, i) => ({_id: `${from + i}`, label: `item ${from + i}`})),
    total,
});

type Overrides = Partial<InfiniteListProps<Item>>;

const list = (props: Overrides) => (
    <InfiniteList<Item>
        data={null}
        loading={false}
        onFilterChange={() => {}}
        renderItem={(item) => <div>{item.label}</div>}
        limit={3}
        {...props}
    />
);

/**
 * Mounts empty and then delivers a response, which is the only order `useInfiniteScroll` accepts:
 * it merges a response only if it arrived after the request it sent, so data already present at
 * mount is treated as stale and ignored.
 */
const mountThen = (props: Overrides, wrap: (node: ReactNode) => ReactNode = (n) => n) => {
    const view = render(<>{wrap(list({loading: true, ...props, data: null}))}</>);
    return {
        ...view,
        deliver: (next: Overrides) => view.rerender(<>{wrap(list({loading: false, ...props, ...next}))}</>),
    };
};

afterEach(() => {
    vi.mocked(useIsInViewport).mockReset();
    setInView(false);
});

describe("InfiniteList", () => {
    it("renders the items of a delivered chunk", () => {
        const {deliver} = mountThen({});
        deliver({data: page(0, 3, 3)});
        expect(screen.getByText("item 0")).toBeInTheDocument();
        expect(screen.getByText("item 2")).toBeInTheDocument();
    });

    it("asks for the first chunk on mount", () => {
        const onFilterChange = vi.fn();
        mountThen({onFilterChange});
        expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({offset: 0, limit: 3}));
    });

    it("merges extraParams into every request", () => {
        const onFilterChange = vi.fn();
        mountThen({onFilterChange, extraParams: {unreadOnly: true}});
        expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({unreadOnly: true}));
    });

    describe("empty, loading and error states", () => {
        it("shows the loader while the first chunk is in flight", () => {
            const {container} = mountThen({});
            expect(container.querySelector("svg")).toBeInTheDocument();
            expect(screen.queryByText("No data")).not.toBeInTheDocument();
        });

        it("shows the empty state when the first chunk comes back empty", () => {
            const {deliver} = mountThen({});
            deliver({data: {data: [], total: 0}});
            expect(screen.getByText("No data")).toBeInTheDocument();
        });

        it("takes over the view for an error with nothing loaded yet", () => {
            const {deliver} = mountThen({});
            deliver({error: {message: "boom"}});
            expect(screen.getByText(/^Error/)).toBeInTheDocument();
        });

        /**
         * The regression this suite exists for: `error` was checked before the item list, so a
         * failed page N replaced everything the user had already scrolled through with an error box.
         */
        it("keeps the loaded items visible when a later chunk fails", () => {
            const {deliver} = mountThen({});
            deliver({data: page(0, 3, 30)});
            deliver({data: page(0, 3, 30), error: {message: "boom"}});
            expect(screen.getByText("item 0")).toBeInTheDocument();
            expect(screen.getByText(/^Error/)).toBeInTheDocument();
        });

        /** An armed sentinel sitting in view would immediately re-request the chunk that failed. */
        it("disarms the sentinel while an error is showing", () => {
            const onFilterChange = vi.fn();
            const {deliver} = mountThen({onFilterChange});
            deliver({data: page(0, 3, 30)});
            onFilterChange.mockClear();
            setInView(true);
            deliver({data: page(0, 3, 30), error: {message: "boom"}});
            expect(onFilterChange).not.toHaveBeenCalled();
        });
    });

    describe("default copy", () => {
        /** `LanguageResolveContext` is the nearest `withLanguage` ancestor's resolver. */
        it("reads the ancestor's dictionary rather than hardcoding English", () => {
            const resolve = ((key: string) => (key === "noDataTitle" ? "Keine Daten" : null)) as never;
            const {deliver} = mountThen({}, (node) => (
                <LanguageResolveContext.Provider value={resolve}>{node}</LanguageResolveContext.Provider>
            ));
            deliver({data: {data: [], total: 0}});
            expect(screen.getByText("Keine Daten")).toBeInTheDocument();
        });

        it("still renders something when no ancestor dictionary has the key", () => {
            const {deliver} = mountThen({});
            deliver({data: {data: [], total: 0}});
            expect(screen.getByText("No data")).toBeInTheDocument();
        });

        it("lets a caller override the empty state entirely", () => {
            const {deliver} = mountThen({renderNoData: () => <p>Nothing here</p>});
            deliver({data: {data: [], total: 0}});
            expect(screen.getByText("Nothing here")).toBeInTheDocument();
            expect(screen.queryByText("No data")).not.toBeInTheDocument();
        });
    });
});
