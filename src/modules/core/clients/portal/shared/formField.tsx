import {useId, type ComponentProps} from "react";
import {Field, FieldError, FieldLabel} from "@coreModule/components/ui/field.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";

type FormFieldProps = Omit<ComponentProps<typeof Input>, "id"> & {label: string; error?: string};

/** A labelled input with its error, the way every portal form lays them out. */
export default function FormField({label, error, ...input}: FormFieldProps) {
    const id = useId();
    return (
        <Field data-invalid={error ? true : undefined}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <Input id={id} aria-invalid={error ? true : undefined} className="px-3.5" {...input} />
            <FieldError>{error}</FieldError>
        </Field>
    );
}
