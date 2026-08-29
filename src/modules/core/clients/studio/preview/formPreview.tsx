import {useMemo, useRef} from "react";
import {z} from "zod";
import type {FieldValues, Resolver} from "react-hook-form";
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";
import FormViewRenderer from "@coreModule/components/viewEngine/FormViewRenderer.tsx";
import {IconInfoCircle} from "@tabler/icons-react";
import type {SampleRow} from "./useSampleRows.ts";

type FormPreviewProps = {
    config: ViewConfig;
    /** Seeds an edit form so conditional widgets have something to react to. */
    row: SampleRow | null;
    resolveLanguageKey: ResolveLanguageKey;
    formExtras: Record<string, unknown> | undefined;
};

/**
 * Renders the real `FormViewRenderer` with validation switched off.
 *
 * Validation lives in an Armonia Zod factory that each page imports by name
 * (`createCountryFormSchema`); nothing in a `ViewConfig` points at it, so the Studio
 * cannot resolve one generically. `FormViewRenderer` already accepts a `resolver`
 * override, and `resolver ?? zodResolver(formSchema)` short-circuits — so the empty
 * schema below is never evaluated. Layout is what is being edited here; validation is
 * exercised by the real page.
 */
export default function FormPreview({
    config,
    row,
    resolveLanguageKey,
    formExtras,
}: FormPreviewProps) {
    const innerRef = useRef<WithAxiosLifecycleRef<unknown> | null>(null);

    /** Accepts anything: the preview never submits. */
    const passThroughResolver = useMemo<Resolver<FieldValues>>(
        () => async (values) => ({values, errors: {}}),
        [],
    );

    const emptySchema = useMemo(() => z.object({}), []);

    const defaultValues = useMemo<FieldValues>(
        () => (config.viewMode === "edit" && row ? (row as FieldValues) : {}),
        [config.viewMode, row],
    );

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <p className="flex shrink-0 items-center gap-1.5 border-b bg-muted/40 px-3 py-1.5 text-3xs text-muted-foreground">
                <IconInfoCircle className="size-3 shrink-0" />
                Layout preview — validation is off and submit is inert.
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <FormViewRenderer
                    /* Remount when the shape changes so react-hook-form re-seeds defaults. */
                    key={`${config.model}:${config.viewMode}:${row?._id ?? "blank"}`}
                    config={config}
                    resolveLanguageKey={resolveLanguageKey}
                    formSchema={emptySchema}
                    resolver={passThroughResolver}
                    defaultValues={defaultValues}
                    loading={false}
                    innerRef={innerRef}
                    onSubmit={() => {}}
                    onCancel={() => {}}
                    formExtras={formExtras}
                    hideChrome
                />
            </div>
        </div>
    );
}
