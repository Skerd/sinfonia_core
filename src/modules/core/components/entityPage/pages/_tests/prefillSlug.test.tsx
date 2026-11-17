import {act, render} from "@testing-library/react";
import {describe, expect, it} from "vitest";
import {useForm, type UseFormReturn} from "react-hook-form";
import {PrefillSlug} from "../prefillSlug.tsx";

type PostForm = {title: string; slug: string};

function renderForm(): {form: () => UseFormReturn<PostForm>} {
    let current: UseFormReturn<PostForm> | null = null;
    function Probe() {
        const form = useForm<PostForm>({defaultValues: {title: "", slug: ""}});
        current = form;
        return <PrefillSlug form={form} from="title" to="slug" max={128}/>;
    }
    render(<Probe/>);
    return {form: () => current!};
}

// TD-F116: blog post and category slugs had to be typed by hand.
describe("slug prefill", () => {
    it("fills the slug from the title as it is typed", () => {
        const {form} = renderForm();
        act(() => form().setValue("title", "How to build a capsule wardrobe"));
        expect(form().getValues("slug")).toBe("how-to-build-a-capsule-wardrobe");
    });

    it("leaves a slug edited by hand alone", () => {
        const {form} = renderForm();
        act(() => form().setValue("slug", "capsule", {shouldDirty: true}));
        act(() => form().setValue("title", "How to build a capsule wardrobe"));
        expect(form().getValues("slug")).toBe("capsule");
    });
});
