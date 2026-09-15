import {act, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {useRef} from "react";
import useIsInViewport, {type UseIsInViewportOptions} from "@baseModule/helpers/hooks/useIsInViewport.ts";

class MockIntersectionObserver {
    static instances: MockIntersectionObserver[] = [];
    readonly targets = new Set<Element>();
    disconnected = false;

    constructor(
        private readonly callback: IntersectionObserverCallback,
        readonly options: IntersectionObserverInit = {},
    ) {
        MockIntersectionObserver.instances.push(this);
    }

    observe(target: Element) { this.targets.add(target); }
    unobserve(target: Element) { this.targets.delete(target); }
    disconnect() { this.disconnected = true; this.targets.clear(); }
    takeRecords() { return []; }

    trigger(isIntersecting: boolean) {
        const entries = [...this.targets].map((target) => ({isIntersecting, target}) as IntersectionObserverEntry);
        act(() => this.callback(entries, this as unknown as IntersectionObserver));
    }
}

const activeObserver = () => MockIntersectionObserver.instances.filter((o) => !o.disconnected).at(-1)!;

function Probe({targetKey = "a", showTarget = true, showRoot = false, options}: {
    targetKey?: string;
    showTarget?: boolean;
    showRoot?: boolean;
    options?: UseIsInViewportOptions;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const inView = useIsInViewport(ref, rootRef, options);
    return (
        <div>
            <p data-testid="state">{String(inView)}</p>
            {showRoot && <div data-testid="root" ref={rootRef}/>}
            {showTarget && <div key={targetKey} data-testid={`target-${targetKey}`} ref={ref}/>}
        </div>
    );
}

describe("useIsInViewport", () => {
    beforeEach(() => {
        MockIntersectionObserver.instances = [];
        vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
    });
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("reports intersection changes for the target", () => {
        render(<Probe/>);
        expect(activeObserver().targets).toContain(screen.getByTestId("target-a"));

        activeObserver().trigger(true);
        expect(screen.getByTestId("state")).toHaveTextContent("true");
        activeObserver().trigger(false);
        expect(screen.getByTestId("state")).toHaveTextContent("false");
    });

    it("re-observes a target that is replaced in the same render", () => {
        const {rerender} = render(<Probe targetKey="a"/>);
        rerender(<Probe targetKey="b"/>);

        expect(activeObserver().targets).toContain(screen.getByTestId("target-b"));
        expect(MockIntersectionObserver.instances.filter((o) => !o.disconnected)).toHaveLength(1);
    });

    it("resets to false when the target unmounts, and observes it again when it returns", () => {
        const {rerender} = render(<Probe/>);
        activeObserver().trigger(true);

        rerender(<Probe showTarget={false}/>);
        expect(screen.getByTestId("state")).toHaveTextContent("false");
        expect(MockIntersectionObserver.instances.every((o) => o.disconnected)).toBe(true);

        rerender(<Probe/>);
        expect(activeObserver().targets).toContain(screen.getByTestId("target-a"));
    });

    it("rebuilds the observer when the root attaches later or options change", () => {
        const {rerender} = render(<Probe/>);
        expect(activeObserver().options.root).toBeNull();

        rerender(<Probe showRoot/>);
        expect(activeObserver().options.root).toBe(screen.getByTestId("root"));

        rerender(<Probe showRoot options={{rootMargin: "200px"}}/>);
        expect(activeObserver().options.rootMargin).toBe("200px");
        expect(MockIntersectionObserver.instances.filter((o) => !o.disconnected)).toHaveLength(1);
    });

    it("keeps one observer across unrelated re-renders and disconnects on unmount", () => {
        const {rerender, unmount} = render(<Probe/>);
        rerender(<Probe/>);
        rerender(<Probe/>);
        expect(MockIntersectionObserver.instances).toHaveLength(1);

        unmount();
        expect(MockIntersectionObserver.instances[0].disconnected).toBe(true);
    });

    it("stays false when IntersectionObserver is unavailable", () => {
        vi.stubGlobal("IntersectionObserver", undefined);
        render(<Probe/>);
        expect(screen.getByTestId("state")).toHaveTextContent("false");
    });
});
