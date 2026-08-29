import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {getRegisteredWidgetTokens, getWidgetMeta} from "@coreModule/components/viewEngine/widgetRegistry.ts";

/**
 * The palette, derived from the live widget registry.
 *
 * `getRegisteredWidgetTokens()` returns core widgets plus everything module
 * `widgetContribution` files added, so the Studio can never offer a token that
 * `resolveWidget` would fail on at render time.
 *
 * Container-ness, mode and starting props now come from `widgetMeta` on the registry.
 * The literals below are the fallback for tokens nothing has described yet — they were
 * the whole story before the metadata existed, and keeping them means an undescribed
 * module widget behaves exactly as it used to.
 */

/**
 * Tokens whose components render `children`. Verified against the components
 * themselves, not guessed from the name — a node nested under anything else would
 * be dropped silently by `renderRegisteredComponent`.
 */
const FALLBACK_CONTAINER_TOKENS = new Set([
    "#SheetGroup",
    "#SheetGrid",
    "#FormGrid",
    "#TitleWithCollapse",
    "#FormWhenFieldValueIn",
    "#ReferencesViewModeScope",
]);

/** Plain HTML tags. `renderNode` falls through to `createElement(token, …)` for these. */
export const HTML_TOKENS = ["div", "span", "p"] as const;

/**
 * Widgets that are display-only chrome rather than a data binding — they take
 * `props`, not a `field`.
 */
const FALLBACK_NON_FIELD_TOKENS = new Set([
    ...FALLBACK_CONTAINER_TOKENS,
    "#FormAlert",
    "#ReferencesViewModeToggle",
]);

/** Sensible starting `props` per container, matching each component's own defaults. */
const FALLBACK_DEFAULT_PROPS: Record<string, Record<string, unknown>> = {
    "#SheetGroup": {title: ""},
    "#SheetGrid": {columns: 3},
    "#FormGrid": {columns: 2},
    "#TitleWithCollapse": {title: ""},
    "#FormAlert": {message: ""},
    "#FormWhenFieldValueIn": {watchField: "", whenValues: []},
    "#ReferencesViewModeScope": {storageKey: "", defaultMode: "compact"},
};

/** Whether nesting a node under this token does anything. */
export function isContainerToken(token: string): boolean {
    if (!token.startsWith("#")) return true; // plain HTML tag
    const meta = getWidgetMeta(token);
    if (meta) return !!meta.container;
    return FALLBACK_CONTAINER_TOKENS.has(token);
}

/**
 * Whether this token expects a `field` binding rather than only `props`.
 *
 * Described widgets must say so explicitly: inferring "not a container, therefore a
 * field" would classify chrome like `#FormAlert` and `#ReferencesViewModeToggle` as
 * bindable and hand them an empty field the renderer would never read.
 */
export function isFieldToken(token: string): boolean {
    if (!token.startsWith("#")) return false;
    const meta = getWidgetMeta(token);
    if (meta) return meta.bindsField === true;
    return !FALLBACK_NON_FIELD_TOKENS.has(token);
}

/**
 * Whether the token is meaningful in this view type. Undescribed tokens are offered
 * everywhere — the palette filter is a way to cut noise, not an allowlist.
 */
export function tokenSupportsMode(token: string, mode: "sheet" | "form"): boolean {
    if (!token.startsWith("#")) return true;
    const meta = getWidgetMeta(token);
    if (!meta) return true;
    return meta.modes.includes(mode);
}

/** An empty starting value of the right shape, for a seeded prop with no default. */
function blankFor(type: string): unknown {
    if (type === "string[]") return [];
    if (type === "number") return 0;
    if (type === "boolean") return false;
    if (type === "json") return {};
    return "";
}

/**
 * Starting `props` for a freshly dropped node.
 *
 * Seeds only what the widget cannot work without, plus the optional keys explicitly
 * marked `seed` — writing every documented default into the node would restate the
 * component's own fallbacks in every exported config.
 */
export function defaultPropsFor(token: string): Record<string, unknown> | undefined {
    const meta = getWidgetMeta(token);
    if (meta?.props?.length) {
        const seed: Record<string, unknown> = {};
        for (const prop of meta.props) {
            if (!prop.seed && !prop.required) continue;
            seed[prop.name] = prop.default !== undefined ? prop.default : blankFor(prop.type);
        }
        return Object.keys(seed).length > 0 ? seed : undefined;
    }
    const fallback = FALLBACK_DEFAULT_PROPS[token];
    return fallback ? {...fallback} : undefined;
}

export type PaletteGroup = {
    id: string;
    label: string;
    tokens: string[];
};

/** Core tokens, grouped for the palette. Anything unlisted lands in "Module widgets". */
const CORE_GROUPS: {id: string; label: string; tokens: string[]}[] = [
    {
        id: "layout",
        label: "Layout",
        tokens: [
            "#SheetGroup",
            "#SheetGrid",
            "#FormGrid",
            "#TitleWithCollapse",
            "#FormAlert",
            "#FormWhenFieldValueIn",
            "#ReferencesViewModeScope",
            "#ReferencesViewModeToggle",
        ],
    },
    {
        id: "input",
        label: "Form inputs",
        tokens: [
            "#Input",
            "#Textarea",
            "#Checkbox",
            "#Switch",
            "#SimpleSelect",
            "#ApiSelect",
            "#DateInput",
            "#PhoneInput",
            "#IconPicker",
            "#StringArrayField",
            "#ListingFaqsField",
        ],
    },
    {
        id: "compound",
        label: "Compound fields",
        tokens: [
            "#MediaField",
            "#MainImageField",
            "#ImageGalleryField",
            "#VideoGalleryField",
            "#FormEditMediaField",
            "#FormMultiLocalFileField",
            "#FormRepeater",
            "#FormTabbedRepeater",
            "#FormObjectIdChips",
            "#FormAddressWithMap",
            "#FormAddressRow",
            "#FormMapPinPicker",
        ],
    },
    {
        id: "display",
        label: "Sheet display",
        tokens: [
            "#DisplayCard",
            "#Badge",
            "#ExpandableText",
            "#CountryFlag",
            "#GalleryCarousel",
            "#SheetMediaFilesStrip",
            "#SheetMediaAvatar",
            "#SheetEmbeddedItemsList",
            "#SheetLocationMap",
            "#ReferencesRender",
            "#EmbeddedAddressCard",
        ],
    },
];

export type PaletteOptions = {
    /** Drop tokens whose metadata says they do nothing in this view type. */
    mode?: "sheet" | "form";
};

/**
 * Groups the registry into palette sections. Tokens the registry does not actually
 * hold are dropped, and tokens no group claims are collected into "Module widgets",
 * so a module contribution shows up without this file being edited.
 */
export function buildPaletteGroups(options: PaletteOptions = {}): PaletteGroup[] {
    const registered = new Set(getRegisteredWidgetTokens());
    const claimed = new Set<string>();
    const {mode} = options;

    const allowed = (token: string) => !mode || tokenSupportsMode(token, mode);

    const groups: PaletteGroup[] = [];
    for (const group of CORE_GROUPS) {
        /* Claim before filtering by mode, so a token hidden here does not reappear
           under "Module widgets" as though nothing had classified it. */
        const inRegistry = group.tokens.filter((token) => registered.has(token));
        inRegistry.forEach((token) => claimed.add(token));
        const tokens = inRegistry.filter(allowed);
        if (tokens.length > 0) groups.push({...group, tokens});
    }

    groups.push({id: "html", label: "HTML", tokens: [...HTML_TOKENS]});

    const rest = [...registered].filter((token) => !claimed.has(token) && allowed(token)).sort();
    if (rest.length > 0) {
        groups.push({id: "module", label: "Module widgets", tokens: rest});
    }

    return groups;
}

/**
 * Builds the node a palette drop should insert.
 *
 * The `render` token differs by mode, and this is the part most easily got wrong:
 * in a form, a bound field is `{render: "#Field", field: {…}}` — `#Field` is a
 * pseudo-token that `renderNode` never resolves, because it checks `node.field`
 * first. In a sheet, the bound node repeats the widget in `render`.
 */
export function createPaletteNode(token: string, mode: "sheet" | "form"): ViewNode {
    const isHtml = !token.startsWith("#");
    const isContainer = isContainerToken(token) || isHtml;

    if (isContainer) {
        const props = defaultPropsFor(token);
        return {
            render: token,
            ...(props ? {props} : {}),
            children: [],
        };
    }

    if (!isFieldToken(token)) {
        const props = defaultPropsFor(token);
        return {render: token, ...(props ? {props} : {})};
    }

    return {
        render: mode === "form" ? "#Field" : token,
        field: {name: "", widget: token},
    };
}
