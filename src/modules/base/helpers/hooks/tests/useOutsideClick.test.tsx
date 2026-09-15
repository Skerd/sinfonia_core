import {fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";
import {useRef} from "react";
import {useOutsideClick, type UseOutsideClickOptions} from "@baseModule/helpers/hooks/useOutsideClick.ts";

type HarnessProps = {
    handler: (event: PointerEvent | KeyboardEvent) => void;
    options?: UseOutsideClickOptions;
    withSecondRegion?: boolean;
    attachInside?: boolean;
};

function Harness({handler, options, withSecondRegion = false, attachInside = true}: HarnessProps) {
    const inside = useRef<HTMLDivElement>(null);
    const second = useRef<HTMLDivElement>(null);
    useOutsideClick(withSecondRegion ? [inside, second] : inside, handler, options);

    return (
        <div>
            {attachInside && (
                <div data-testid="inside" ref={inside}>
                    <span data-testid="inside-child"/>
                </div>
            )}
            <div data-testid="second" ref={second}/>
            <div data-testid="outside"/>
            <div data-testid="outside-stopper" onPointerDown={(event) => event.stopPropagation()}/>
        </div>
    );
}

describe("useOutsideClick", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("calls the handler for a pointerdown outside, passing the event", () => {
        const handler = vi.fn();
        render(<Harness handler={handler}/>);

        fireEvent.pointerDown(screen.getByTestId("outside"));

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].type).toBe("pointerdown");
    });

    it("ignores pointerdowns on the element and its descendants", () => {
        const handler = vi.fn();
        render(<Harness handler={handler}/>);

        fireEvent.pointerDown(screen.getByTestId("inside"));
        fireEvent.pointerDown(screen.getByTestId("inside-child"));

        expect(handler).not.toHaveBeenCalled();
    });

    it("treats every passed ref as inside", () => {
        const handler = vi.fn();
        const {rerender} = render(<Harness handler={handler}/>);
        fireEvent.pointerDown(screen.getByTestId("second"));
        expect(handler).toHaveBeenCalledTimes(1);

        rerender(<Harness handler={handler} withSecondRegion/>);
        fireEvent.pointerDown(screen.getByTestId("second"));
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it("still fires when an outside element stops propagation", () => {
        const handler = vi.fn();
        render(<Harness handler={handler}/>);

        fireEvent.pointerDown(screen.getByTestId("outside-stopper"));

        expect(handler).toHaveBeenCalledTimes(1);
    });

    it("does nothing while no inside element is attached", () => {
        const handler = vi.fn();
        render(<Harness handler={handler} attachInside={false}/>);

        fireEvent.pointerDown(screen.getByTestId("outside"));

        expect(handler).not.toHaveBeenCalled();
    });

    it("listens only while enabled", () => {
        const handler = vi.fn();
        const {rerender} = render(<Harness handler={handler} options={{enabled: false}}/>);
        fireEvent.pointerDown(screen.getByTestId("outside"));
        expect(handler).not.toHaveBeenCalled();

        rerender(<Harness handler={handler} options={{enabled: true}}/>);
        fireEvent.pointerDown(screen.getByTestId("outside"));
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it("handles Escape only when asked to, and only while enabled", () => {
        const handler = vi.fn();
        const {rerender} = render(<Harness handler={handler}/>);
        fireEvent.keyDown(document, {key: "Escape"});
        expect(handler).not.toHaveBeenCalled();

        rerender(<Harness handler={handler} options={{escape: true}}/>);
        fireEvent.keyDown(document, {key: "Enter"});
        expect(handler).not.toHaveBeenCalled();
        fireEvent.keyDown(document, {key: "Escape"});
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].type).toBe("keydown");

        rerender(<Harness handler={handler} options={{escape: true, enabled: false}}/>);
        fireEvent.keyDown(document, {key: "Escape"});
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it("uses the latest handler without re-subscribing", () => {
        const addSpy = vi.spyOn(document, "addEventListener");
        const first = vi.fn();
        const latest = vi.fn();
        const {rerender} = render(<Harness handler={first}/>);
        rerender(<Harness handler={latest}/>);
        rerender(<Harness handler={latest}/>);

        fireEvent.pointerDown(screen.getByTestId("outside"));

        expect(first).not.toHaveBeenCalled();
        expect(latest).toHaveBeenCalledTimes(1);
        expect(addSpy.mock.calls.filter(([type]) => type === "pointerdown")).toHaveLength(1);
    });

    it("stops listening on unmount", () => {
        const handler = vi.fn();
        const {unmount} = render(<Harness handler={handler}/>);
        const outside = document.createElement("div");
        document.body.appendChild(outside);

        unmount();
        fireEvent.pointerDown(outside);
        fireEvent.keyDown(document, {key: "Escape"});

        expect(handler).not.toHaveBeenCalled();
        outside.remove();
    });
});
