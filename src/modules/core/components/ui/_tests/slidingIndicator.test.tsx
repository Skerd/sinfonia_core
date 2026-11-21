import {render} from "@testing-library/react";
import {afterAll, beforeAll, describe, expect, it} from "vitest";
import {SlidingIndicator} from "@coreModule/components/ui/sliding-indicator.tsx";

/** A test DOM has no layout: items say where they sit through `data-left`. */
function stubLayout(property: "offsetLeft" | "offsetTop" | "offsetWidth" | "offsetHeight", read: (element: HTMLElement) => number) {
    Object.defineProperty(HTMLElement.prototype, property, {configurable: true, get() { return read(this); }});
}

function Row({active}: {active?: string}) {
    return (
        <div className="relative">
            <SlidingIndicator activeKey={active} />
            {["a", "b"].map((key, index) => (
                <span key={key} data-left={index * 70} data-indicator-active={active === key ? "" : undefined}>{key}</span>
            ))}
        </div>
    );
}

describe("SlidingIndicator", () => {
    beforeAll(() => {
        stubLayout("offsetLeft", (element) => Number(element.dataset.left ?? 0));
        stubLayout("offsetTop", () => 4);
        stubLayout("offsetWidth", () => 60);
        stubLayout("offsetHeight", () => 28);
    });
    afterAll(() => {
        for (const property of ["offsetLeft", "offsetTop", "offsetWidth", "offsetHeight"]) Reflect.deleteProperty(HTMLElement.prototype, property);
    });

    const indicator = (container: HTMLElement) => container.querySelector<HTMLElement>("[data-slot=sliding-indicator]");

    it("draws nothing while no item is active", () => {
        const {container} = render(<Row />);
        expect(indicator(container)).toHaveClass("hidden");
    });

    it("sits behind the active item and follows it to the next one", () => {
        const {container, rerender} = render(<Row active="a" />);
        expect(indicator(container)).not.toHaveClass("hidden");
        expect(indicator(container)?.style.transform).toBe("translate(0px, 4px)");
        expect(indicator(container)?.style.width).toBe("60px");

        rerender(<Row active="b" />);
        expect(indicator(container)?.style.transform).toBe("translate(70px, 4px)");
    });

    it("can follow the page link a NavLink marks as current", () => {
        const {container} = render(
            <div className="relative">
                <SlidingIndicator activeKey="/account/security" activeSelector="[aria-current='page']" />
                <a href="/account/profile" data-left={0}>Profile</a>
                <a href="/account/security" data-left={70} aria-current="page">Security</a>
            </div>,
        );
        expect(indicator(container)?.style.transform).toBe("translate(70px, 4px)");
    });
});
