import {fireEvent, render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";

// The toggle's copy comes from the dictionary loader, which reaches for the redux store.
vi.mock("@coreModule/helpers/hooks/useSelectedLanguage.ts", () => ({
    default: () => ({currentLanguage: {show: "Show password", hide: "Hide password"}}),
}));

const {PasswordInput} = await import("@coreModule/components/custom/inputs/passwordInput.tsx");

/** The field is only reachable by its placeholder: a masked input has no `textbox` role. */
const field = () => screen.getByPlaceholderText("Password") as HTMLInputElement;
const toggle = () => screen.getByRole("button");

describe("PasswordInput", () => {
    it("masks the value until the toggle is used", () => {
        render(<PasswordInput placeholder="Password"/>);
        expect(field()).toHaveAttribute("type", "password");

        fireEvent.click(toggle());
        expect(field()).toHaveAttribute("type", "text");

        fireEvent.click(toggle());
        expect(field()).toHaveAttribute("type", "password");
    });

    /** Icon-only, so without a name it announced as just "button". */
    it("names the toggle and reports its state", () => {
        render(<PasswordInput placeholder="Password"/>);
        expect(screen.getByRole("button", {name: "Show password"})).toHaveAttribute("aria-pressed", "false");

        fireEvent.click(toggle());
        expect(screen.getByRole("button", {name: "Hide password"})).toHaveAttribute("aria-pressed", "true");
    });

    it("points the toggle at the input it controls", () => {
        // FormControl hands the id down; the two are otherwise unlinked.
        render(<PasswordInput id="password" placeholder="Password"/>);
        expect(toggle()).toHaveAttribute("aria-controls", "password");
    });

    it("leaves focus in the field when toggled with a pointer", () => {
        render(<PasswordInput placeholder="Password"/>);
        field().focus();

        const notCancelled = fireEvent.pointerDown(toggle());
        // preventDefault() on pointerdown is what stops focus moving to the button.
        expect(notCancelled).toBe(false);
        expect(field()).toHaveFocus();
    });

    it("disables the toggle along with the field", () => {
        render(<PasswordInput placeholder="Password" disabled/>);
        expect(field()).toBeDisabled();
        expect(toggle()).toBeDisabled();
    });

    it("passes the form's props through to the input", () => {
        render(<PasswordInput placeholder="Password" name="password" aria-invalid autoComplete="new-password"/>);
        expect(field()).toHaveAttribute("name", "password");
        expect(field()).toHaveAttribute("aria-invalid", "true");
        expect(field()).toHaveAttribute("autocomplete", "new-password");
    });
});
