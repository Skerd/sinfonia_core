import {render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";

vi.mock("@coreModule/components/viewEngine/widgets/addresses/sheetLocationMap.tsx", () => ({default: () => null}));
vi.mock("react-redux", () => ({
    useSelector: (pick: (state: unknown) => unknown) => pick({authentication: {user: {timezone: "Europe/Tirane"}}, language: {languageCode: "en-US"}}),
    useDispatch: () => () => undefined,
}));

import SheetCompanyAddressesSection from "../sheetCompanyAddressesSection.tsx";

const resolve = ((key: string) => key) as never;
const address = {street: "Rruga Myslym Shyri 26", country: {_id: "c1", name: "Albania"}, city: {_id: "t1", name: "Tirana"}, latitude: 41.3, longitude: 19.8};

// TD-F115: an address without a state or postal code showed "State: ⓘ" and "Postal code: ⓘ".
describe("address sheet", () => {
    it("leaves off a state and postal code the address does not have", () => {
        render(<SheetCompanyAddressesSection addresses={[address]} resolveLanguageKey={resolve}/>);
        expect(screen.getByText("form.cityLabel")).toBeTruthy();
        expect(screen.queryByText("form.stateLabel")).toBeNull();
        expect(screen.queryByText("form.postalCodeLabel")).toBeNull();
    });

    it("shows them when set", () => {
        render(<SheetCompanyAddressesSection addresses={[{...address, state: {_id: "s1", name: "Tirana County"}, postalCode: "1001"}]} resolveLanguageKey={resolve}/>);
        expect(screen.getByText("form.stateLabel")).toBeTruthy();
        expect(screen.getByText("1001")).toBeTruthy();
    });
});
