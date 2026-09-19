import type {ReactNode} from "react";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {FormProvider, useForm} from "react-hook-form";

// FormMaxLengthControl (rendered whenever `maxLength` is set) is wrapped in the language HOC,
// which reaches for the redux store; the harness fake stands in for it.
vi.mock("@baseModule/helpers/hocs/withLanguage.tsx", async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    default: (await import("@baseModule/components/viewEngine/__tests__/harness.tsx")).fakeWithLanguage,
}));

const {StringArrayInput} = await import("@baseModule/components/custom/inputs/stringArrayInput.tsx");

function FormHost({values = {}, children}: {values?: Record<string, unknown>; children: ReactNode}) {
    const form = useForm({defaultValues: values});
    return <FormProvider {...form}>{children}</FormProvider>;
}

function renderField(
    props: Partial<React.ComponentProps<typeof StringArrayInput>> = {},
    values: Record<string, unknown> = {},
) {
    render(
        <FormHost values={values}>
            <StringArrayInput
                name="tags"
                labelKey="Tags"
                placeholderKey="Add a tag"
                removeTooltipKey="Remove"
                {...props}
            />
        </FormHost>,
    );
    return {
        draft: screen.getByPlaceholderText("Add a tag"),
        addButton: screen.getByRole("button", {name: "Tags"}),
        chips: () => screen.queryAllByRole("listitem").map((chip) => chip.textContent),
    };
}

describe("StringArrayInput", () => {
    it("adds the trimmed draft on Enter and clears the input", async () => {
        const {draft, chips} = renderField();
        fireEvent.change(draft, {target: {value: "  alpha  "}});
        fireEvent.keyDown(draft, {key: "Enter"});

        await waitFor(() => expect(chips()).toEqual(["alpha"]));
        expect(draft).toHaveValue("");
    });

    /** The icon-only button announced as "button" before it carried the label. */
    it("names the add button for screen readers", () => {
        const {addButton} = renderField();
        expect(addButton).toBeInTheDocument();
    });

    it("keeps the add button out of reach until there is something to add", () => {
        const {draft, addButton} = renderField();
        expect(addButton).toBeDisabled();
        fireEvent.change(draft, {target: {value: "alpha"}});
        expect(addButton).toBeEnabled();
        // Whitespace is not something to add.
        fireEvent.change(draft, {target: {value: "   "}});
        expect(addButton).toBeDisabled();
    });

    it("clears the draft on a repeat instead of leaving it stuck", async () => {
        const {draft, addButton, chips} = renderField({}, {tags: ["alpha"]});
        fireEvent.change(draft, {target: {value: "alpha"}});
        fireEvent.click(addButton);

        await waitFor(() => expect(draft).toHaveValue(""));
        expect(chips()).toEqual(["alpha"]);
    });

    /** Removing by value took every copy with it when the stored data already had repeats. */
    it("removes one entry per click even when the stored value repeats", async () => {
        const {chips} = renderField({}, {tags: ["alpha", "alpha", "beta"]});
        fireEvent.click(screen.getAllByRole("button", {name: "Remove: alpha"})[0]);
        await waitFor(() => expect(chips()).toEqual(["alpha", "beta"]));
    });

    /** `["a", 1, null]` or a bare string from an API used to throw inside the badge list. */
    it("survives a stored value that is not a string array", () => {
        expect(() => renderField({}, {tags: "alpha"})).not.toThrow();
        expect(screen.queryAllByRole("listitem")).toHaveLength(0);

        render(
            <FormHost values={{tags: ["alpha", 7, null]}}>
                <StringArrayInput name="tags" labelKey="T" placeholderKey="P" removeTooltipKey="R"/>
            </FormHost>,
        );
        expect(screen.getAllByRole("listitem").map((c) => c.textContent)).toEqual(["alpha"]);
    });

    it("stops accepting entries at maxItems", () => {
        const {draft, addButton} = renderField({maxItems: 2}, {tags: ["alpha", "beta"]});
        expect(draft).toBeDisabled();
        expect(addButton).toBeDisabled();
    });

    it("caps an entry at maxLength", async () => {
        const {draft, addButton, chips} = renderField({maxLength: 4});
        fireEvent.change(draft, {target: {value: "abcdefgh"}});
        fireEvent.click(addButton);
        await waitFor(() => expect(chips()).toEqual(["abcd"]));
    });

    it("leaves the list alone while an IME composition is being committed", () => {
        const {draft, chips} = renderField();
        fireEvent.change(draft, {target: {value: "alpha"}});
        fireEvent.keyDown(draft, {key: "Enter", isComposing: true});
        expect(chips()).toEqual([]);
    });
});
