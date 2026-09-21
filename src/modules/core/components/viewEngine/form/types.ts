import type {ComponentType, ReactNode} from "react";
import type {FieldBinding} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";

/** Form-level state handed to every widget adapter. */
export type FormWidgetExtra = {
    loading?: boolean;
    editMode?: boolean;
    writeAccess?: Record<string, any>;
    formExtras?: Record<string, unknown>;
};

export type CompoundFormWidgetArgs = {
    Widget: ComponentType<any>;
    binding: FieldBinding;
    resolveLanguageKey: ResolveLanguageKey;
    extra?: FormWidgetExtra;
};

/**
 * Maps a binding to the props of a compound form widget — one that registers its own
 * `FormField`s through `useFormContext()` and must not be wrapped in another.
 */
export type CompoundFormWidgetRenderer = (args: CompoundFormWidgetArgs) => ReactNode;
