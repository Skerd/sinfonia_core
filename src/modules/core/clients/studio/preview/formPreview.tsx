import {useMemo, useRef} from "react";
import {z} from "zod";
import type {FieldValues, Resolver} from "react-hook-form";
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";
import FormViewRenderer from "@coreModule/components/viewEngine/FormViewRenderer.tsx";
import EditFormViewRenderer from "@coreModule/components/viewEngine/editFormViewRenderer.tsx";
import {IconInfoCircle} from "@tabler/icons-react";
import type {SampleRow} from "./useSampleRows.ts";

type FormPreviewProps = {
    config: ViewConfig;
    /** Seeds an edit form so conditional widgets have something to react to. */
    row: SampleRow | null;
    resolveLanguageKey: ResolveLanguageKey;
    formExtras: Record<string, unknown> | undefined;
    /**
     * The account's write map, narrowed by the access simulator when it is on. Edit forms
     * gate every field on it, so without it the preview shows fields the panel would not.
     */
    writeAccess: Record<string, unknown> | undefined;
};

/**
 * Renders the panel's own form renderers with validation switched off.
 *
 * Which renderer matters: create pages mount `FormViewRenderer`, edit pages mount
 * `EditFormViewRenderer`, and only the latter applies the write gate that *removes* a field
 * the account cannot write — maestro's `disabled` flag never gets a chance to show. Preview
 * through the wrong one and the Studio answers a question the panel was never asked.
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
    writeAccess,
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
                {config.viewMode === "edit" ? (
                    <EditFormViewRenderer
                        /* Remount when the shape changes so react-hook-form re-seeds defaults. */
                        key={`${config.model}:edit:${row?._id ?? "blank"}`}
                        config={config}
                        resolveLanguageKey={resolveLanguageKey}
                        formSchema={emptySchema}
                        resolver={passThroughResolver}
                        initialValues={defaultValues}
                        loading={false}
                        innerRef={innerRef}
                        onSubmit={() => {}}
                        onCancel={() => {}}
                        onSuccess={() => {}}
                        loadingDataErrorTitle="errorTitle"
                        loadingDataErrorDescription="errorDescription"
                        formExtras={formExtras}
                        writeAccess={writeAccess}
                        hideChrome
                    />
                ) : (
                    <FormViewRenderer
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
                )}
            </div>
        </div>
    );
}
