import {render} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";
import {createRef} from "react";
import useIsInViewport from "@baseModule/helpers/hooks/useIsInViewport.ts";
import LoadMoreSentinel from "@baseModule/components/custom/loader/loadMoreSentinel.tsx";

vi.mock("@baseModule/helpers/hooks/useIsInViewport.ts", () => ({default: vi.fn(() => false)}));

const inViewMock = vi.mocked(useIsInViewport);
const setInView = (value: boolean) => inViewMock.mockReturnValue(value);

describe("LoadMoreSentinel", () => {
    afterEach(() => {
        inViewMock.mockReset();
        inViewMock.mockReturnValue(false);
    });

    it("renders an invisible marker with no text", () => {
        const {container} = render(<LoadMoreSentinel canLoadMore onLoadMore={() => {}}/>);
        const marker = container.firstElementChild!;
        expect(marker).toHaveAttribute("aria-hidden", "true");
        expect(marker.textContent).toBe("");
    });

    it("calls onLoadMore when in view and loading is allowed", () => {
        setInView(true);
        const onLoadMore = vi.fn();
        render(<LoadMoreSentinel canLoadMore onLoadMore={onLoadMore}/>);
        expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it("does not call onLoadMore when out of view or not allowed", () => {
        const onLoadMore = vi.fn();
        const {rerender} = render(<LoadMoreSentinel canLoadMore onLoadMore={onLoadMore}/>);
        expect(onLoadMore).not.toHaveBeenCalled();

        setInView(true);
        rerender(<LoadMoreSentinel canLoadMore={false} onLoadMore={onLoadMore}/>);
        expect(onLoadMore).not.toHaveBeenCalled();
    });

    it("fires once per load: not on unrelated re-renders, again after canLoadMore toggles back on", () => {
        setInView(true);
        const onLoadMore = vi.fn();
        const {rerender} = render(<LoadMoreSentinel canLoadMore onLoadMore={onLoadMore}/>);
        rerender(<LoadMoreSentinel canLoadMore onLoadMore={onLoadMore}/>);
        expect(onLoadMore).toHaveBeenCalledTimes(1);

        rerender(<LoadMoreSentinel canLoadMore={false} onLoadMore={onLoadMore}/>);
        rerender(<LoadMoreSentinel canLoadMore onLoadMore={onLoadMore}/>);
        expect(onLoadMore).toHaveBeenCalledTimes(2);
    });

    it("fires when scrolled into view and uses the latest callback", () => {
        const first = vi.fn();
        const latest = vi.fn();
        const {rerender} = render(<LoadMoreSentinel canLoadMore onLoadMore={first}/>);

        setInView(true);
        rerender(<LoadMoreSentinel canLoadMore onLoadMore={latest}/>);

        expect(first).not.toHaveBeenCalled();
        expect(latest).toHaveBeenCalledTimes(1);
    });

    it("observes within the given scroll root and root margin", () => {
        const scrollRoot = createRef<HTMLElement>();
        render(<LoadMoreSentinel canLoadMore={false} onLoadMore={() => {}} scrollRoot={scrollRoot} rootMargin="200px"/>);

        expect(inViewMock).toHaveBeenCalledWith(expect.anything(), scrollRoot, {rootMargin: "200px"});
    });
});
