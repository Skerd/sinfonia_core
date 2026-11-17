import {useEffect} from "react";
import type {FieldValues, Path, PathValue, UseFormReturn} from "react-hook-form";
import {toSlug} from "armonia/src/modules/core/helpers/slug.ts";

type PrefillSlugProps<TForm extends FieldValues> = {
    form: UseFormReturn<TForm>;
    /** The name or title the slug is made from. */
    from: Path<TForm>;
    /** The slug field. */
    to: Path<TForm>;
    max: number;
};

/**
 * Fills a create form's slug from its name or title as it is typed, until the slug is edited by hand (UX-05). Render it
 * through a create page's `renderChildren`; an edit form keeps its slug, so a changed title never breaks a link.
 */
export function PrefillSlug<TForm extends FieldValues>({form, from, to, max}: PrefillSlugProps<TForm>) {
    const source = form.watch(from);
    const editedByHand = form.getFieldState(to, form.formState).isDirty;

    useEffect(() => {
        if (editedByHand) return;
        const slug = toSlug(typeof source === "string" ? source : "", max) as PathValue<TForm, Path<TForm>>;
        form.setValue(to, slug, {shouldDirty: false, shouldValidate: false});
    }, [form, source, editedByHand, to, max]);

    return null;
}
