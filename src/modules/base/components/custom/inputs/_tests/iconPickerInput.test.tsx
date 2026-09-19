import {fireEvent, render, screen} from "@testing-library/react";
import {beforeAll, describe, expect, it, vi} from "vitest";

const DICTIONARY: Record<string, string> = {
    placeholder: "Select an icon...",
    searchPlaceholder: "Search icons...",
    emptyMessage: "No icon found.",
    clear: "Clear",
    "labels.mdiHome": "Home",
    "labels.mdiGarage": "Garage",
};

// The picker resolves its own copy through the language HOC, which reaches for the redux store.
vi.mock("@baseModule/helpers/hocs/withLanguage.tsx", async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    default: () => (Component: (props: Record<string, unknown>) => unknown) => (props: Record<string, unknown>) =>
        Component({
            ...props,
            resolveLanguageKey: (key: string, orNull?: boolean) =>
                DICTIONARY[key] ?? (orNull ? null : `---${key}---`),
        }),
}));

const {IconPickerInput} = await import("@baseModule/components/custom/inputs/iconPickerInput.tsx");

beforeAll(() => {
    // cmdk keeps the active row in view; jsdom has no layout and so no scrollIntoView.
    Element.prototype.scrollIntoView ??= vi.fn();
});

const trigger = () => screen.getByRole("combobox");
const openList = () => {
    fireEvent.click(trigger());
    return screen.getByPlaceholderText("Search icons...");
};
const options = () => screen.queryAllByRole("option").map((option) => option.textContent);

describe("IconPickerInput trigger", () => {
    it("shows the placeholder while nothing is picked", () => {
        render(<IconPickerInput onValueChange={vi.fn()}/>);
        expect(trigger()).toHaveTextContent("Select an icon...");
    });

    it("prefers a placeholder the caller passed over the dictionary's", () => {
        // The view's own binding.placeholder is the more specific of the two.
        render(<IconPickerInput placeholder="Unit icon" onValueChange={vi.fn()}/>);
        expect(trigger()).toHaveTextContent("Unit icon");
    });

    it.each(["mdiHome", "mdi-home", "MDIHOME", "Home"])("resolves the stored value %s", (value) => {
        render(<IconPickerInput value={value} onValueChange={vi.fn()}/>);
        expect(trigger()).toHaveTextContent("Home");
    });

    it("shows an unknown value rather than dropping it silently", () => {
        render(<IconPickerInput value="mdiNotAnIcon" onValueChange={vi.fn()}/>);
        expect(trigger()).toHaveTextContent("mdiNotAnIcon");
    });

    /** FormControl's Slot hands these down; they used to be dropped, so the field had no error ring. */
    it("carries the form's id and invalid state", () => {
        render(<IconPickerInput id="unitIcon" aria-invalid onValueChange={vi.fn()}/>);
        expect(trigger()).toHaveAttribute("id", "unitIcon");
        expect(trigger()).toHaveAttribute("aria-invalid", "true");
    });
});

describe("IconPickerInput clearing", () => {
    it("offers no clear control while empty", () => {
        render(<IconPickerInput onValueChange={vi.fn()}/>);
        expect(screen.queryByRole("button", {name: "Clear"})).not.toBeInTheDocument();
    });

    it("clears to an empty value", () => {
        const onValueChange = vi.fn();
        render(<IconPickerInput value="mdiHome" onValueChange={onValueChange}/>);
        fireEvent.click(screen.getByRole("button", {name: "Clear"}));
        expect(onValueChange).toHaveBeenCalledWith("");
    });
});

describe("IconPickerInput list", () => {
    it("picks an icon by its name", () => {
        const onValueChange = vi.fn();
        render(<IconPickerInput onValueChange={onValueChange}/>);
        openList();
        fireEvent.click(screen.getByRole("option", {name: /Garage/}));
        expect(onValueChange).toHaveBeenCalledWith("mdiGarage");
    });

    it("searches on the translated label and on the icon name", () => {
        render(<IconPickerInput onValueChange={vi.fn()}/>);
        const search = openList();

        fireEvent.change(search, {target: {value: "Garage"}});
        expect(options()).toEqual(["Garage"]);

        fireEvent.change(search, {target: {value: "mdiHome"}});
        expect(options()).toContain("Home");

        fireEvent.change(search, {target: {value: "zzzzz"}});
        expect(options()).toEqual([]);
        expect(screen.getByText("No icon found.")).toBeInTheDocument();
    });

    /** The grid was built from plain buttons, which the arrow keys could not reach. */
    it("selects with the keyboard", () => {
        const onValueChange = vi.fn();
        render(<IconPickerInput onValueChange={onValueChange}/>);
        const search = openList();

        fireEvent.change(search, {target: {value: "Garage"}});
        fireEvent.keyDown(search, {key: "Enter"});
        expect(onValueChange).toHaveBeenCalledWith("mdiGarage");
    });
});
