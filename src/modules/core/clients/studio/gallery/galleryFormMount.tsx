import {useMemo, useRef} from "react";
import {z} from "zod";
import type {FieldValues, Resolver} from "react-hook-form";
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";
import FormViewRenderer from "@coreModule/components/viewEngine/FormViewRenderer.tsx";

type GalleryFormMountProps = {
    config: ViewConfig;
    defaultValues: FieldValues;
    resolveLanguageKey: ResolveLanguageKey;
    formExtras?: Record<string, unknown>;
};

/**
 * The panel's create-form renderer, with page chrome and submit actions off.
 *
 * Same path `FormPreview` uses — a gallery tile that went through a private form
 * wrapper would not tell you what changing `#Input` does on a real page.
 */
export default function GalleryFormMount({
    config,
    defaultValues,
    resolveLanguageKey,
    formExtras,
}: GalleryFormMountProps) {
    const innerRef = useRef<WithAxiosLifecycleRef<unknown> | null>(null);

    const passThroughResolver = useMemo<Resolver<FieldValues>>(
        () => async (values) => ({values, errors: {}}),
        [],
    );
    const emptySchema = useMemo(() => z.object({}), []);

    return (
        <FormViewRenderer
            key={config.nodes[0]?.render ?? config.model}
            config={config}
            resolveLanguageKey={resolveLanguageKey}
            formSchema={emptySchema}
            resolver={passThroughResolver}
            defaultValues={defaultValues}
            loading={false}
            innerRef={innerRef}
            onSubmit={() => {}}
            onCancel={() => {}}
            hideChrome
            hideActions
            formExtras={formExtras}
        />
    );
}
