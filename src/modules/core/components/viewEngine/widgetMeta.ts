/**
 * Machine-readable description of what each widget token accepts and where it works.
 *
 * `widgetRegistry` maps a token to a component and nothing else, so everything that
 * needs to *reason* about a widget — which mode it belongs to, whether it renders
 * children, which props it takes — has had to hard-code its own list. This is that
 * knowledge in one place, consumed by the Studio's palette, props editor and lint.
 *
 * Two sources, no guessing:
 *  - **Modes** are taken from how the 124 `*.views.ts` files actually use each token.
 *    The split is clean in practice: `#DisplayCard` appears 2870 times in sheets and
 *    never in a form; `#Input` 487 times in forms and never in a sheet. Layout tokens
 *    with no mode-specific behaviour (`#TitleWithCollapse`, plain HTML) are listed for
 *    both, because nothing stops them working there.
 *  - **Props** are transcribed from the contract JSDoc on `ViewNode` / `FieldBinding`.
 *
 * A token with no entry is treated as unconstrained, never as invalid — this map is
 * additive metadata, not an allowlist. Modules describe their own widgets through
 * `WidgetContribution.widgetMeta`.
 */

export type WidgetPropType = "string" | "number" | "boolean" | "enum" | "string[]" | "json";

/** Which autocomplete source the Studio's props editor should attach to a field. */
export type WidgetPropSuggest =
    | "readPath"
    | "writePath"
    | "apiUrl"
    | "icon"
    | "languageKey"
    | "widgetToken";

export type WidgetPropMeta = {
    name: string;
    type: WidgetPropType;
    enum?: string[];
    /** The widget cannot function without it — lint reports a missing one as an error. */
    required?: boolean;
    /**
     * The component's own fallback. Shown as placeholder text; only written into a new
     * node when {@link seed} (or {@link required}) says so, so a documented default does
     * not end up restated in every exported config.
     */
    default?: unknown;
    /**
     * Write this key into a freshly created node, to give the developer a visible slot.
     * Required props are always seeded; this is for the optional ones worth prompting for.
     */
    seed?: boolean;
    docs?: string;
    suggest?: WidgetPropSuggest;
};

export type WidgetMeta = {
    /** View types this token is meaningful in. */
    modes: ("sheet" | "form")[];
    /** Renders `props.children`. Anything else silently discards nested nodes. */
    container?: boolean;
    /** Takes a `field` binding rather than only `props`. */
    bindsField?: boolean;
    docs?: string;
    /** Keys read from `node.props`. */
    props?: WidgetPropMeta[];
    /** Keys read from `field.widgetProps`. */
    widgetProps?: WidgetPropMeta[];
};

const BOTH: ("sheet" | "form")[] = ["sheet", "form"];
const SHEET: ("sheet" | "form")[] = ["sheet"];
const FORM: ("sheet" | "form")[] = ["form"];

/** Shared by every plain form input. */
const INPUT_META: WidgetMeta = {modes: FORM, bindsField: true};

export const CORE_WIDGET_META: Record<string, WidgetMeta> = {
    // -----------------------------------------------------------------------
    // Layout containers
    // -----------------------------------------------------------------------
    "#SheetGroup": {
        modes: SHEET,
        container: true,
        docs: "Titled section of a sheet. Collapse state persists per sheet model.",
        props: [
            {name: "title", type: "string", seed: true, suggest: "languageKey", docs: "Language key."},
            {
                name: "titleIcon",
                type: "string",
                suggest: "icon",
                docs: "Tabler token, e.g. `#IconBuildingBridge2`. Dropped if it does not resolve.",
            },
            {name: "titleIconClassName", type: "string"},
            {
                name: "titleActions",
                type: "string",
                suggest: "widgetToken",
                docs: "Widget token rendered in the title row, e.g. `#ReferencesViewModeToggle`.",
            },
            {
                name: "collapseKey",
                type: "string",
                docs: "Overrides the collapse storage key derived from title + sheet model.",
            },
        ],
    },
    "#SheetGrid": {
        modes: SHEET,
        container: true,
        props: [{name: "columns", type: "number", default: 3, seed: true}],
    },
    "#FormGrid": {
        modes: FORM,
        container: true,
        props: [
            {name: "columns", type: "number", default: 2, seed: true},
            {name: "className", type: "string"},
        ],
    },
    "#TitleWithCollapse": {
        /* Used only in forms today, but it is a generic titled collapsible. */
        modes: BOTH,
        container: true,
        props: [{name: "title", type: "string", required: true, suggest: "languageKey"}],
    },
    "#FormWhenFieldValueIn": {
        modes: FORM,
        container: true,
        docs: "Renders children only while the watched field matches.",
        props: [
            {name: "watchField", type: "string", required: true, suggest: "writePath"},
            {name: "whenValues", type: "string[]", seed: true, docs: "Ignored when `whenNonEmpty` is set."},
            {
                name: "whenNonEmpty",
                type: "boolean",
                docs: "Show whenever the watched value is a non-empty trimmed string.",
            },
            {name: "clearFields", type: "string[]", docs: "Cleared when the condition is false."},
            {
                name: "setFieldsOnMatch",
                type: "json",
                docs: "Paths set when the condition becomes true; skips initial mount.",
            },
        ],
    },
    "#ReferencesViewModeScope": {
        modes: SHEET,
        container: true,
        docs: "Persists compact/cards layout for the `#ReferencesRender` list inside it.",
        props: [
            {name: "storageKey", type: "string", required: true},
            {name: "defaultMode", type: "enum", enum: ["compact", "cards"], default: "compact", seed: true},
        ],
    },

    // -----------------------------------------------------------------------
    // Non-field chrome
    // -----------------------------------------------------------------------
    "#FormAlert": {
        modes: FORM,
        props: [{name: "message", type: "string", required: true, suggest: "languageKey"}],
    },
    "#ReferencesViewModeToggle": {modes: SHEET},

    // -----------------------------------------------------------------------
    // Form inputs
    // -----------------------------------------------------------------------
    "#Input": INPUT_META,
    "#Textarea": INPUT_META,
    "#Checkbox": INPUT_META,
    "#Switch": INPUT_META,
    "#DateInput": INPUT_META,
    "#PhoneInput": INPUT_META,
    "#IconPicker": INPUT_META,
    "#SimpleSelect": INPUT_META,
    "#Select": INPUT_META,
    "#ApiSelect": {
        modes: FORM,
        bindsField: true,
        docs: "Async select. Cross-field behaviour is configured entirely through widgetProps.",
        widgetProps: [
            {name: "apiUrl", type: "string", required: true, suggest: "apiUrl"},
            {name: "method", type: "enum", enum: ["GET", "POST"], default: "POST"},
            {name: "pageSize", type: "number", default: 50},
            {
                name: "cascadeClearFormFields",
                type: "string[]",
                suggest: "writePath",
                docs: "Cleared when this value changes from one non-empty id to another.",
            },
            {
                name: "enableWhenFormFieldsNonEmpty",
                type: "string[]",
                suggest: "writePath",
                docs: "Stays disabled until every listed path has a value.",
            },
            {
                name: "postBodyFromFormFields",
                type: "json",
                docs: "`[{field, paramName}]` merged into the select's POST body.",
            },
            {name: "postBodyFromFormField", type: "json", docs: "`{field, paramName?}`. Single-param form."},
            {name: "postBodyFormExtrasMerge", type: "json"},
            {name: "normalizeEmptyToUndefined", type: "boolean"},
            {name: "remountKeyFormField", type: "string", suggest: "writePath"},
        ],
    },
    "#StringArrayField": {
        modes: FORM,
        bindsField: true,
        widgetProps: [
            {name: "maxItems", type: "number"},
            {name: "maxLength", type: "number"},
            {name: "removeTooltipKey", type: "string", suggest: "languageKey", default: "remove"},
        ],
    },
    "#ListingFaqsField": {
        modes: FORM,
        bindsField: true,
        widgetProps: [
            {name: "maxRows", type: "number"},
            {name: "questionPlaceholderKey", type: "string", suggest: "languageKey"},
            {name: "answerPlaceholderKey", type: "string", suggest: "languageKey"},
            {name: "addRowLabelKey", type: "string", suggest: "languageKey"},
            {name: "removeRowTooltipKey", type: "string", suggest: "languageKey"},
        ],
    },

    // -----------------------------------------------------------------------
    // Compound form fields — these own their FormField, see `isCompoundFormWidget`
    // -----------------------------------------------------------------------
    "#MediaField": {
        modes: FORM,
        bindsField: true,
        widgetProps: [
            {name: "mode", type: "enum", enum: ["single", "multiple"], default: "single"},
            {name: "mediaType", type: "enum", enum: ["image", "video", "file"], default: "image"},
            {name: "accept", type: "string", docs: 'File input accept, e.g. "image/*", ".pdf".'},
            {name: "maxCount", type: "number", docs: "Defaults to 1 single, 10 image, 3 video."},
            {name: "onDialog", type: "boolean", docs: "Tightens the grid for dialog widths."},
        ],
    },
    "#MainImageField": {modes: FORM, bindsField: true},
    "#ImageGalleryField": {modes: FORM, bindsField: true},
    "#VideoGalleryField": {modes: FORM, bindsField: true},
    "#FormEditMediaField": {modes: FORM, bindsField: true},
    "#FormMultiLocalFileField": {modes: FORM, bindsField: true},
    "#FormObjectIdChips": {modes: FORM, bindsField: true},
    "#FormAddressWithMap": {modes: FORM, bindsField: true},
    "#FormAddressRow": {modes: FORM, bindsField: true},
    "#FormMapPinPicker": {modes: FORM, bindsField: true},
    "#FormRepeater": {
        modes: FORM,
        bindsField: true,
        widgetProps: [
            {name: "arrayField", type: "string", suggest: "writePath"},
            {name: "fieldPrefix", type: "string", suggest: "writePath"},
            {name: "deleteField", type: "string"},
            {name: "defaultItem", type: "json"},
            {name: "rowTemplate", type: "json", docs: "ViewNode[] rendered per row."},
            {name: "rowCascades", type: "json"},
            {name: "rowTitleFields", type: "string[]"},
            {name: "title", type: "string", suggest: "languageKey"},
        ],
    },
    "#FormTabbedRepeater": {modes: FORM, bindsField: true},

    // -----------------------------------------------------------------------
    // Sheet display
    // -----------------------------------------------------------------------
    "#DisplayCard": {
        modes: SHEET,
        bindsField: true,
        docs: "The default sheet field renderer: icon, label and a resolved value.",
        widgetProps: [
            {name: "icon", type: "string", suggest: "icon"},
            {name: "dontRenderValue", type: "boolean", docs: "Icon and label only."},
            {
                name: "type",
                type: "enum",
                enum: ["media"],
                docs: "`media` renders file tiles instead of text.",
            },
            {
                name: "languageKeyCategory",
                type: "string",
                docs: "Resolves the value as `{category}.{value}`.",
            },
            {name: "parent", type: "string", suggest: "readPath"},
            {
                name: "valuePath",
                type: "string[]",
                docs: "Joined with `parent` to build the value, and to gate read access.",
            },
            {name: "bodyWidget", type: "string", suggest: "widgetToken"},
            {name: "valueType", type: "enum", enum: ["linkedObjectRefCardList"]},
            {name: "linkedSheetModel", type: "string"},
            {name: "linkedSheetWidget", type: "string", suggest: "widgetToken"},
            {name: "linkedSheetEntityProp", type: "string", default: "project"},
            {name: "linkedRefListLayout", type: "enum", enum: ["responsive4", "grid4"]},
            {name: "labelField", type: "string", default: "name"},
        ],
    },
    "#ReferencesRender": {
        modes: SHEET,
        bindsField: true,
        docs: "Paginated list of reference stubs, as cards or compact rows.",
        widgetProps: [
            {name: "cardWidget", type: "string", suggest: "widgetToken"},
            {name: "itemDataProp", type: "string", docs: "Defaults per known `cardWidget`."},
            {name: "pageSize", type: "number", default: 3},
            {name: "cardProps", type: "json", docs: "Shallow-merged into each card."},
            {
                name: "compactRow",
                type: "json",
                docs: "Required for compact mode — without it the toggle still renders cards.",
            },
            {name: "hideActions", type: "boolean"},
            {name: "listClassName", type: "string", docs: "Not scanned by Tailwind from API configs."},
        ],
    },
    "#SheetMediaFilesStrip": {
        modes: SHEET,
        bindsField: true,
        widgetProps: [
            {name: "combineFromFields", type: "string[]", suggest: "readPath"},
            {name: "className", type: "string"},
            {name: "canDownload", type: "boolean"},
            {name: "canRemove", type: "boolean"},
            {name: "isBig", type: "boolean"},
        ],
    },
    "#SheetMediaAvatar": {
        modes: SHEET,
        bindsField: true,
        widgetProps: [{name: "nameField", type: "string", default: "name", suggest: "readPath"}],
    },
    "#SheetEmbeddedItemsList": {modes: SHEET, bindsField: true},
    "#SheetLocationMap": {modes: SHEET, bindsField: true},
    "#EmbeddedAddressCard": {modes: SHEET, bindsField: true},
    "#ExpandableText": {modes: SHEET, bindsField: true},
    "#GalleryCarousel": {modes: SHEET, bindsField: true},
    "#CountryFlag": {modes: SHEET, bindsField: true},
    "#Badge": {modes: SHEET, bindsField: true},
    "#CurrencySheetView": {modes: SHEET, bindsField: true},
    "#CountrySheetView": {modes: SHEET, bindsField: true},
    "#StateSheetView": {modes: SHEET, bindsField: true},
    "#CitySheetView": {modes: SHEET, bindsField: true},
};

/** Plain HTML tags the renderer falls through to `createElement` for. */
export const HTML_TAG_META: WidgetMeta = {modes: BOTH, container: true};
