import {fireEvent, render, screen} from "@testing-library/react";
import {beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import {PhoneInput} from "@coreModule/components/custom/inputs/phoneInput.tsx";

// The component only needs labels from the dictionary loader, and that loader pulls in the redux
// store; the test supplies the dictionary directly instead.
const language = vi.hoisted(() => ({current: {currentLanguage: null, languageCode: "en-US"}}));
vi.mock("@coreModule/helpers/hooks/useSelectedLanguage.ts", () => ({
    default: () => language.current,
}));

beforeEach(() => {
    language.current = {currentLanguage: null, languageCode: "en-US"};
});

beforeAll(() => {
    // cmdk keeps the active row in view; jsdom has no layout and so no scrollIntoView.
    Element.prototype.scrollIntoView ??= vi.fn();
});

const openCountryList = () => {
    fireEvent.click(screen.getByRole("button", {name: /Select country/}));
    return screen.getByPlaceholderText("Search country...");
};

const countryRow = (name: string) =>
    screen.queryAllByRole("option").find((row) => row.textContent?.startsWith(name));

describe("PhoneInput country select", () => {
    it("names the trigger for screen readers", () => {
        // The trigger holds nothing but a flag and a chevron, so without this it announces as "button".
        render(<PhoneInput defaultCountry="AL" value={undefined} onChange={vi.fn()}/>);
        expect(
            screen.getByRole("button", {name: "Select country: Albania (+355)"}),
        ).toBeInTheDocument();
    });

    it("finds a country by name, by code and by dialling code", () => {
        render(<PhoneInput defaultCountry="AL" value={undefined} onChange={vi.fn()}/>);
        const search = openCountryList();

        fireEvent.change(search, {target: {value: "Germ"}});
        expect(countryRow("Germany")).toBeDefined();
        expect(countryRow("Albania")).toBeUndefined();

        // Rows are addressed by ISO code, so both of these run through the item keywords.
        fireEvent.change(search, {target: {value: "355"}});
        expect(countryRow("Albania")).toBeDefined();

        fireEvent.change(search, {target: {value: "CH"}});
        expect(countryRow("Switzerland")).toBeDefined();
    });

    it("reports nothing found rather than an empty list", () => {
        render(<PhoneInput defaultCountry="AL" value={undefined} onChange={vi.fn()}/>);
        fireEvent.change(openCountryList(), {target: {value: "zzzzz"}});
        expect(screen.getByText("No country found.")).toBeInTheDocument();
    });

    it("switches the selected country", () => {
        render(<PhoneInput defaultCountry="AL" value={undefined} onChange={vi.fn()}/>);
        openCountryList();
        fireEvent.click(countryRow("Switzerland")!);
        expect(
            screen.getByRole("button", {name: "Select country: Switzerland (+41)"}),
        ).toBeInTheDocument();
    });

    /** The library bundles English names only; the rest are fetched for the active locale. */
    it("shows country names in the user's language", async () => {
        language.current = {currentLanguage: null, languageCode: "de-CH"};
        render(<PhoneInput defaultCountry="AL" value={undefined} onChange={vi.fn()}/>);

        const trigger = await screen.findByRole("button", {name: /Albanien/});
        fireEvent.click(trigger);
        expect(countryRow("Deutschland")).toBeDefined();
    });

    it("keeps the phone number the caller passed in", () => {
        render(<PhoneInput defaultCountry="CH" value={"+41441234567" as never} onChange={vi.fn()}/>);
        expect(screen.getByRole("textbox")).toHaveValue("+41 44 123 45 67");
    });
});
