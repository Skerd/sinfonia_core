import {describe, expect, it, vi} from "vitest";
import {render} from "@testing-library/react";
import {MemoryRouter, useNavigate} from "react-router-dom";
import {useEffect} from "react";

/* D181: an address naming its language (`?lang=`) speaks it; once, so a language picked afterwards stays. */

const dispatched = vi.hoisted(() => [] as unknown[]);
vi.mock("react-redux", async (importOriginal) => ({
    ...await importOriginal<object>(),
    useDispatch: () => (action: unknown) => dispatched.push(action),
}));

import {usePortalAddressLanguage} from "../portalLanguage.ts";

function Page({goTo}: {goTo?: string}) {
    usePortalAddressLanguage();
    const navigate = useNavigate();
    useEffect(() => {
        if (goTo) navigate(goTo);
    }, [goTo, navigate]);
    return null;
}

const picked = () => dispatched.map((action) => (action as {payload: unknown}).payload);

describe("usePortalAddressLanguage (D181)", () => {
    it("picks the language the address names, once", () => {
        dispatched.length = 0;
        const {rerender} = render(<MemoryRouter initialEntries={["/car-rental/in/tirane?lang=sq-AL"]}><Page /></MemoryRouter>);
        rerender(<MemoryRouter initialEntries={["/car-rental/in/tirane?lang=sq-AL"]}><Page /></MemoryRouter>);
        expect(picked()).toEqual(["sq-AL"]);
    });

    it("leaves the language alone without one, or with one the portal does not speak", () => {
        dispatched.length = 0;
        render(<MemoryRouter initialEntries={["/?kind=product"]}><Page goTo="/?lang=xx-XX" /></MemoryRouter>);
        expect(picked()).toEqual([]);
    });

    it("follows a link to another language", () => {
        dispatched.length = 0;
        render(<MemoryRouter initialEntries={["/?lang=sq-AL"]}><Page goTo="/?lang=de-CH" /></MemoryRouter>);
        expect(picked()).toEqual(["sq-AL", "de-CH"]);
    });
});
