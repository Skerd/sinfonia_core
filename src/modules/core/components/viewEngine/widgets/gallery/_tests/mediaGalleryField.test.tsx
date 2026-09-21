import {render, screen, fireEvent} from "@testing-library/react";
import {describe, expect, it, vi, beforeEach} from "vitest";
import {FormProvider, useForm} from "react-hook-form";
import {MediaGalleryField, type GalleryItemComponentProps} from "@coreModule/components/viewEngine/widgets/gallery/mediaGalleryField.tsx";

beforeEach(() => {
    let n = 0;
    vi.stubGlobal("URL", {...URL, createObjectURL: vi.fn(() => `blob:test/${n++}`), revokeObjectURL: vi.fn()});
});

function Item({src, alt, onRemove, disabled}: GalleryItemComponentProps) {
    return (
        <div data-testid="item" data-src={src}>
            <span>{alt}</span>
            <button type="button" disabled={disabled} onClick={onRemove}>remove {alt}</button>
        </div>
    );
}

function Harness({defaultValues, editMode = false}: {defaultValues: Record<string, unknown>; editMode?: boolean}) {
    const form = useForm({defaultValues});
    return (
        <FormProvider {...form}>
            <MediaGalleryField
                resolveLanguageKey={(k) => k}
                editMode={editMode}
                fieldName="gallery"
                maxItems={3}
                accept="image/*"
                labelKey="form.galleryLabel"
                ItemComponent={Item}
                existingAlt={(pos) => `existing ${pos}`}
                fileAlt={(f) => f.name}
            />
        </FormProvider>
    );
}

const file = (name: string) => new File(["x"], name, {type: "image/png"});

describe("MediaGalleryField", () => {
    it("fills the grid to maxItems with add-placeholders", () => {
        render(<Harness defaultValues={{gallery: []}}/>);
        expect(screen.getAllByRole("button", {name: "form.galleryLabel"})).toHaveLength(3);
    });

    it("renders existing media by id in edit mode, not as a File", () => {
        render(<Harness defaultValues={{gallery: ["media-abc"]}} editMode/>);
        expect(screen.getByTestId("item")).toHaveAttribute("data-src", "/api/auxiliary/media/media-abc");
        expect(screen.getByText("existing 1")).toBeInTheDocument();
    });

    it("leaves only one placeholder when one slot of three is taken", () => {
        render(<Harness defaultValues={{gallery: ["a", "b"]}} editMode/>);
        expect(screen.getAllByRole("button", {name: "form.galleryLabel"})).toHaveLength(1);
    });

    it("removes the clicked entry", () => {
        render(<Harness defaultValues={{gallery: ["a", "b"]}} editMode/>);
        fireEvent.click(screen.getByRole("button", {name: "remove existing 1"}));
        expect(screen.getAllByTestId("item")).toHaveLength(1);
        expect(screen.getByText("existing 1")).toBeInTheDocument(); // "b" renumbered to position 1
    });

    it("caps an over-long selection at the remaining slots", () => {
        const {container} = render(<Harness defaultValues={{gallery: ["a"]}} editMode/>);
        const input = container.querySelector('input[type="file"]')!;
        fireEvent.change(input, {target: {files: [file("1.png"), file("2.png"), file("3.png"), file("4.png")]}});
        expect(screen.getAllByTestId("item")).toHaveLength(3); // 1 existing + 2 added, not 4
    });

    it("gives the add-placeholder an accessible name", () => {
        render(<Harness defaultValues={{gallery: []}}/>);
        expect(screen.getAllByRole("button", {name: "form.galleryLabel"})[0]).toHaveAttribute("type", "button");
    });
});
