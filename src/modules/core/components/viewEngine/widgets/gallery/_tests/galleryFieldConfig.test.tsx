import {render, screen} from "@testing-library/react";
import {describe, expect, it, vi, beforeEach} from "vitest";
import {FormProvider, useForm} from "react-hook-form";
import {ImageGalleryField} from "@coreModule/components/viewEngine/widgets/gallery/imageGalleryField.tsx";
import {VideoGalleryField} from "@coreModule/components/viewEngine/widgets/gallery/videoGalleryField.tsx";

beforeEach(() => {
    vi.stubGlobal("URL", {...URL, createObjectURL: vi.fn(() => "blob:test"), revokeObjectURL: vi.fn()});
});

function Harness({Field, defaultValues}: {Field: typeof ImageGalleryField; defaultValues: Record<string, unknown>}) {
    const form = useForm({defaultValues});
    return (
        <FormProvider {...form}>
            <Field resolveLanguageKey={(k) => k} editMode/>
        </FormProvider>
    );
}

/** Both fields are configured from the same shared component, so a swapped config is the
 *  likeliest regression: assert each one's own field name, cap and label. */
describe("gallery field configuration", () => {
    it("ImageGalleryField reads imageGallery and caps at 10", () => {
        render(<Harness Field={ImageGalleryField} defaultValues={{imageGallery: ["a"], videoGallery: []}}/>);
        expect(screen.getByText("form.imageGalleryLabel")).toBeInTheDocument();
        expect(screen.getAllByRole("button", {name: "form.imageGalleryLabel"})).toHaveLength(9);
    });

    it("VideoGalleryField reads videoGallery and caps at 3", () => {
        render(<Harness Field={VideoGalleryField} defaultValues={{imageGallery: [], videoGallery: ["a"]}}/>);
        expect(screen.getByText("form.videoGalleryLabel")).toBeInTheDocument();
        expect(screen.getAllByRole("button", {name: "form.videoGalleryLabel"})).toHaveLength(2);
    });

    it("each field ignores the other's form value", () => {
        render(<Harness Field={VideoGalleryField} defaultValues={{imageGallery: ["a", "b", "c"], videoGallery: []}}/>);
        expect(screen.getAllByRole("button", {name: "form.videoGalleryLabel"})).toHaveLength(3);
    });
});
