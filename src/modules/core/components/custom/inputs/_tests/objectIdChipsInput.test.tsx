import type {ReactNode} from "react";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {FormProvider, useForm, useFormContext} from "react-hook-form";

/**
 * The real picker talks to the API. The stub keeps the test on this component's own job — the
 * chips — while still exercising the `onValueChange(value, label)` contract it is handed.
 */
let pick: (value: string | string[], label?: string | string[]) => void = () => {};
vi.mock("@coreModule/components/viewEngine/widgets/inputs/apiSelect/apiSelect.tsx", () => ({
    ApiSelect: ({onValueChange, placeholder, disabled, markedValues}: {
        onValueChange: (value: string | string[], label?: string | string[]) => void;
        placeholder?: string;
        disabled?: boolean;
        markedValues?: string[];
    }) => {
        pick = onValueChange;
        return (
            <button type="button" disabled={disabled} data-marked={(markedValues ?? []).join(",")}>
                {placeholder}
            </button>
        );
    },
}));

const {ObjectIdChipsInput} = await import("@coreModule/components/custom/inputs/objectIdChipsInput.tsx");

function ValueProbe({name}: {name: string}) {
    const form = useFormContext();
    return <output data-testid="value">{JSON.stringify(form.watch(name) ?? null)}</output>;
}

function FormHost({values = {}, children}: {values?: Record<string, unknown>; children: ReactNode}) {
    const form = useForm({defaultValues: values});
    return <FormProvider {...form}>{children}</FormProvider>;
}

function renderInput(
    props: Partial<React.ComponentProps<typeof ObjectIdChipsInput>> = {},
    values: Record<string, unknown> = {},
) {
    render(
        <FormHost values={values}>
            <ObjectIdChipsInput
                resolveLanguageKey={((key: string) => key) as never}
                name="refs"
                apiUrl="/api/thing/select"
                placeholderKey="Pick one"
                removeTooltipKey="Remove"
                {...props}
            />
            <ValueProbe name="refs"/>
        </FormHost>,
    );
    return {
        chips: () => screen.queryAllByRole("listitem").map((chip) => chip.textContent),
        value: () => JSON.parse(screen.getByTestId("value").textContent || "null"),
    };
}

describe("ObjectIdChipsInput", () => {
    it("adds a picked id and labels its chip", async () => {
        const {chips, value} = renderInput();
        fireEvent.click(screen.getByRole("button", {name: "Pick one"}));
        act(() => pick("id-b", "Beta"));

        await waitFor(() => expect(chips()).toEqual(["Beta"]));
        expect(value()).toEqual(["id-b"]);
    });

    /** A label-less option used to be dropped on the floor: no chip, no value. */
    it("accepts a pick that carries no label and falls back to the id", async () => {
        const {chips, value} = renderInput();
        act(() => pick("id-b", ""));
        await waitFor(() => expect(value()).toEqual(["id-b"]));
        expect(chips()).toEqual(["id-b"]);
    });

    it("ignores a repeat of an id already held", async () => {
        const {value} = renderInput();
        act(() => pick("id-b", "Beta"));
        await waitFor(() => expect(value()).toEqual(["id-b"]));
        act(() => pick("id-b", "Beta"));
        expect(value()).toEqual(["id-b"]);
    });

    /** Stored values arrive from the API: populated refs, repeats and blanks all turn up. */
    it("normalises what the form already holds", () => {
        const {chips} = renderInput({}, {refs: ["id-a", {_id: "id-b"}, "id-a", null, ""]});
        expect(chips()).toEqual(["id-a", "id-b"]);
    });

    it("survives a stored value that is not an array", () => {
        const {chips} = renderInput({}, {refs: "id-a"});
        expect(chips()).toEqual([]);
    });

    it("removes the chip that was clicked, by name", async () => {
        const {chips, value} = renderInput({}, {refs: ["id-a", "id-b"]});
        fireEvent.click(screen.getByRole("button", {name: "Remove: id-a"}));

        await waitFor(() => expect(value()).toEqual(["id-b"]));
        expect(chips()).toEqual(["id-b"]);
    });

    it("locks the picker and the chips while loading", () => {
        renderInput({loading: true}, {refs: ["id-a"]});
        expect(screen.getByRole("button", {name: "Pick one"})).toBeDisabled();
        // The remove control used to stay live: a bare <X> with an onClick.
        expect(screen.getByRole("button", {name: "Remove: id-a"})).toBeDisabled();
    });

    it("marks what is already held so the picker can tick it", () => {
        renderInput({}, {refs: ["id-a"]});
        expect(screen.getByRole("button", {name: "Pick one"})).toHaveAttribute("data-marked", "id-a");
    });

    it("takes preloaded labels from the shared formExtras ref", () => {
        const labelRefs = {constructors: {current: {"id-a": "Acme Ltd"}}};
        const {chips} = renderInput(
            {labelRefFormExtraKey: "constructors", formExtras: {objectIdChipLabelRefs: labelRefs}},
            {refs: ["id-a"]},
        );
        expect(chips()).toEqual(["Acme Ltd"]);
    });
});
