import {act, render} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi, type MockInstance} from "vitest";
import {MemoryRouter, useNavigate, type NavigateFunction} from "react-router-dom";
import PortalScrollRestoration from "@coreModule/clients/portal/shared/portalScrollRestoration.tsx";

let navigate: NavigateFunction = () => undefined;
function Navigator() {
    navigate = useNavigate();
    return null;
}

/** Scrolls the window to `top` as the visitor would, and lets the position be remembered. */
async function scrollTo(top: number) {
    Object.defineProperty(window, "scrollY", {configurable: true, value: top});
    window.dispatchEvent(new Event("scroll"));
    await act(async () => {
        vi.advanceTimersToNextFrame();
    });
}

const go = (to: string | number) => act(async () => {
    if (typeof to === "number") await navigate(to);
    else await navigate(to);
});

describe("PortalScrollRestoration", () => {
    let scroll: MockInstance<typeof window.scrollTo>;

    beforeEach(() => {
        vi.useFakeTimers({toFake: ["requestAnimationFrame", "cancelAnimationFrame", "setTimeout", "clearTimeout"]});
        scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
        sessionStorage.clear();
    });
    afterEach(() => {
        scroll.mockRestore();
        vi.useRealTimers();
    });

    const mount = (path: string) => render(
        <MemoryRouter initialEntries={[path]}>
            <PortalScrollRestoration />
            <Navigator />
        </MemoryRouter>,
    );

    it("takes over from the browser's own restoring", () => {
        const view = mount("/");
        expect(window.history.scrollRestoration).toBe("manual");
        view.unmount();
    });

    it("starts a new page at the top, and Back returns to where the visitor was", async () => {
        mount("/");
        await scrollTo(2535);
        scroll.mockClear();

        await go("/car-rental/rental/categories/suv");
        expect(scroll).toHaveBeenLastCalledWith({top: 0, left: 0, behavior: "instant"});

        await scrollTo(300);
        await go(-1);
        expect(scroll).toHaveBeenLastCalledWith({top: 2535, left: 0, behavior: "instant"});
    });

    it("keeps the place for the same page with other filters", async () => {
        mount("/?kind=product");
        await scrollTo(900);
        scroll.mockClear();
        await go("/?kind=product&page=2");
        expect(scroll).not.toHaveBeenCalled();
    });

    it("treats another item of a page that opens items by query as a new page", async () => {
        mount("/shop/product?id=1");
        await scrollTo(1800);
        scroll.mockClear();
        await go("/shop/product?id=2");
        expect(scroll).toHaveBeenLastCalledWith({top: 0, left: 0, behavior: "instant"});
    });

    it("keeps the place between the tabs of an account area", async () => {
        mount("/account/profile");
        await scrollTo(400);
        scroll.mockClear();
        await go("/account/security");
        expect(scroll).not.toHaveBeenCalled();
    });

    it("starts at the top for an order opened from its list, and for another account area", async () => {
        mount("/shop/account/orders");
        await scrollTo(700);
        scroll.mockClear();
        await go("/shop/account/orders/o1");
        expect(scroll).toHaveBeenLastCalledWith({top: 0, left: 0, behavior: "instant"});

        await go("/account");
        await scrollTo(300);
        scroll.mockClear();
        await go("/shop/account/orders");
        expect(scroll).toHaveBeenLastCalledWith({top: 0, left: 0, behavior: "instant"});
    });
});
