import {fireEvent, render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key} languageCode="en-US"/>,
}));

import {SimpleSelect} from "../simpleSelect.tsx";

// cmdk scrolls the active option into view; jsdom has no layout.
Element.prototype.scrollIntoView = vi.fn();

// The filter field picker's user fields: most live under `roles.*`, so "rol" matches them through their path (TD-F110).
const userFields = [
    {label: "Status", value: "roles.status"},
    {label: "Unsuccessful logins", value: "roles.unsuccessfulLogins"},
    {label: "Last login", value: "roles.lastLogin"},
    {label: "Roles", value: "roles"},
];

describe("simple select search", () => {
    it("lists the option named by the text first, so Enter picks it", () => {
        render(<SimpleSelect options={userFields} value="" onValueChange={vi.fn()} placeholder="Select a field"/>);
        fireEvent.click(screen.getByRole("combobox"));
        fireEvent.change(screen.getByPlaceholderText(/search/i), {target: {value: "Rol"}});

        const shown = screen.getAllByRole("option").map((option) => option.textContent?.trim());
        expect(shown[0]).toBe("Roles");
        expect(shown).toHaveLength(4);
    });
});

describe("simple select options", () => {
    it("shows a disabled option but does not pick it", () => {
        const onValueChange = vi.fn();
        const policies = [
            {label: "At pickup", value: "pay_at_pickup"},
            {label: "Online when booking · Coming soon", value: "prepay_online", disabled: true},
        ];
        render(<SimpleSelect options={policies} value="pay_at_pickup" onValueChange={onValueChange}/>);
        fireEvent.click(screen.getByRole("combobox"));

        const soon = screen.getByRole("option", {name: /coming soon/i});
        expect(soon.getAttribute("aria-disabled")).toBe("true");
        fireEvent.click(soon);
        expect(onValueChange).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("option", {name: "At pickup"}));
        expect(onValueChange).toHaveBeenCalledWith("pay_at_pickup", "At pickup");
    });
});
