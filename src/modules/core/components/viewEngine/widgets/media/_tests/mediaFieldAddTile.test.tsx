import {render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import type {ComponentType, ReactNode} from "react";
import {FormProvider, useForm} from "react-hook-form";

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", async (original) => ({
    ...(await original<object>()),
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} languageCode="en-US" resolveLanguageKey={(key: string) => key}/>,
}));

import MediaField from "../mediaField.tsx";

function Form({children, values}: {children: ReactNode; values: Record<string, unknown>}) {
    const form = useForm({defaultValues: values});
    return <FormProvider {...form}>{children}</FormProvider>;
}

// TD-F125: a 20-image gallery showed 20 empty "Upload image n/20" tiles, and the cover tile said "Upload image" twice.
describe("media field", () => {
    it("offers one add tile for a gallery, with how many are chosen", () => {
        render(<Form values={{imageGallery: []}}><MediaField name="imageGallery" label="Gallery" mode="multiple" maxCount={20}/></Form>);
        const tiles = screen.getAllByRole("button", {name: /\/20$/});
        expect(tiles.map((tile) => tile.getAttribute("aria-label"))).toEqual(["0/20"]);
    });

    it("says what to upload once for a single image", () => {
        render(<Form values={{mainImage: undefined}}><MediaField name="mainImage" label="Cover" mode="single"/></Form>);
        expect(screen.getAllByText("uploadImageHint")).toHaveLength(1);
    });
});
