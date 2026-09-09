import type {FieldValues} from "react-hook-form";
import type {ViewConfig, ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {getWidgetMeta} from "@coreModule/components/viewEngine/widgetRegistry.ts";
import {
    buildPaletteGroups,
    createPaletteNode,
    defaultPropsFor,
    isContainerToken,
    isFieldToken,
} from "../palette/widgetCatalog.ts";
import type {SampleRow} from "../preview/useSampleRows.ts";
import {GALLERY_OBJECT_ID, isEntityCardToken} from "./galleryEntity.ts";

export {GALLERY_OBJECT_ID};

/**
 * Synthetic model the gallery ViewConfigs hang off. Not a real collection — the renderers
 * need `model` / `accessModel` / `apiUrl`, and country select is a live endpoint the
 * session can actually hit (ApiSelect, chips).
 */
export const GALLERY_MODEL = "studioGallery";
export const GALLERY_API_URL = "/api/auxiliary/country";

const ADDRESS_LABELS = {
    country: "Country",
    countryPlaceholder: "Select a country",
    state: "State",
    statePlaceholder: "Select a state",
    city: "City",
    cityPlaceholder: "Select a city",
    street: "Street",
    streetPlaceholder: "Street",
    postalCode: "Postal code",
    postalCodePlaceholder: "Postal code",
    latitude: "Latitude",
    latitudePlaceholder: "Latitude",
    longitude: "Longitude",
    longitudePlaceholder: "Longitude",
};

const SAMPLE_OPTIONS = [
    {value: "alpha", label: "Alpha"},
    {value: "beta", label: "Beta"},
    {value: "gamma", label: "Gamma"},
];

const SAMPLE_ADDRESS_FORM = {
    street: "Rruga e Durrësit",
    postalCode: "1001",
    latitude: 41.3275,
    longitude: 19.8189,
};

const SAMPLE_ADDRESS_SHEET = {
    ...SAMPLE_ADDRESS_FORM,
    country: {_id: GALLERY_OBJECT_ID, name: "Albania", code: "AL"},
    state: {_id: GALLERY_OBJECT_ID, name: "Tirana"},
    city: {_id: GALLERY_OBJECT_ID, name: "Tirana"},
};

const SAMPLE_MEDIA = {
    _id: "studio/640/400",
    name: "sample.jpg",
    size: 12000,
    extension: "jpg",
    mime: "image/jpeg",
    safeCheckedFlag: true,
};

const REPEATER_ROW: ViewNode[] = [
    {
        render: "#Field",
        field: {
            name: "name",
            widget: "#Input",
            label: "Name",
            placeholder: "Name",
        },
    },
    {
        render: "#Field",
        field: {
            name: "link",
            widget: "#Input",
            label: "Link",
            placeholder: "https://",
        },
    },
];

const SAMPLE_INPUT: ViewNode = {
    render: "#Field",
    field: {name: "text", widget: "#Input", label: "Text", placeholder: "Type here"},
};

const SAMPLE_DISPLAY: ViewNode = {
    render: "#DisplayCard",
    field: {
        name: "name",
        widget: "#DisplayCard",
        label: "Name",
        widgetProps: {icon: "#Tag"},
    },
};

export type GalleryModes = {
    form: boolean;
    sheet: boolean;
    /** Full sheet overlay (`*SheetView`) — opened on demand, never mounted inline. */
    overlay: boolean;
    /** List/reference `*Card` — mounted with a stub entity, not as a ViewConfig field. */
    entityCard: boolean;
};

export type GalleryEntry = GalleryModes & {
    token: string;
    groupId: string;
    groupLabel: string;
};

/** Linked-sheet overlays. Mounting them all open would cover the page. */
export function isOverlayToken(token: string): boolean {
    return token.endsWith("SheetView");
}

/**
 * How the gallery mounts a token. Recomputed from the token at render time so a
 * stale `listGalleryEntries()` result cannot put a card through ViewRenderer.
 *
 * Undescribed module widgets are not offered in both modes: `#Form*` / compound
 * `*Field` need RHF, `#Sheet*` need a sheet row.
 */
export function classifyGalleryToken(token: string): GalleryModes {
    const overlay = isOverlayToken(token);
    const entityCard = isEntityCardToken(token);
    if (overlay) {
        return {form: false, sheet: true, overlay: true, entityCard: false};
    }
    if (entityCard) {
        return {
            form: token === "#UnitCard",
            sheet: true,
            overlay: false,
            entityCard: true,
        };
    }
    const meta = getWidgetMeta(token);
    if (meta) {
        return {
            form: meta.modes.includes("form"),
            sheet: meta.modes.includes("sheet"),
            overlay: false,
            entityCard: false,
        };
    }
    if (token.startsWith("#Form") || (token.endsWith("Field") && !token.startsWith("#Sheet"))) {
        return {form: true, sheet: false, overlay: false, entityCard: false};
    }
    if (token.startsWith("#Sheet")) {
        return {form: false, sheet: true, overlay: false, entityCard: false};
    }
    return {form: true, sheet: true, overlay: false, entityCard: false};
}

function fieldNameFor(token: string): string {
    switch (token) {
        case "#Textarea":
        case "#ExpandableText":
            return "longText";
        case "#Checkbox":
        case "#Switch":
            return "enabled";
        case "#DateInput":
            return "date";
        case "#PhoneInput":
            return "phone";
        case "#IconPicker":
            return "icon";
        case "#SimpleSelect":
        case "#Select":
            return "choice";
        case "#ApiSelect":
            return "country";
        case "#StringArrayField":
            return "tags";
        case "#ListingFaqsField":
            return "faqs";
        case "#FormRepeater":
            return "items";
        case "#FormTabbedRepeater":
            return "findings";
        case "#FormObjectIdChips":
            return "refs";
        case "#FormAddressWithMap":
        case "#FormAddressRow":
        case "#FormMapPinPicker":
        case "#SheetLocationMap":
        case "#EmbeddedAddressCard":
            return "address";
        case "#MediaField":
        case "#MainImageField":
        case "#ImageGalleryField":
        case "#VideoGalleryField":
        case "#FormEditMediaField":
        case "#FormMultiLocalFileField":
        case "#GalleryCarousel":
        case "#SheetMediaFilesStrip":
        case "#SheetMediaAvatar":
            return "media";
        case "#SheetEmbeddedItemsList":
            return "items";
        case "#SheetPriceHistoryChart":
            return "priceHistory";
        case "#SheetModificationLineItems":
            return "lineItems";
        case "#ReferencesRender":
            return "references";
        case "#CountryFlag":
            return "code";
        case "#Badge":
            return "status";
        default:
            return "value";
    }
}

function widgetPropsFor(token: string): Record<string, unknown> | undefined {
    switch (token) {
        case "#SimpleSelect":
        case "#Select":
            return {options: SAMPLE_OPTIONS};
        case "#ApiSelect":
            return {apiUrl: `${GALLERY_API_URL}/select`, method: "POST", pageSize: 50};
        case "#FormObjectIdChips":
            return {
                apiUrl: `${GALLERY_API_URL}/select`,
                method: "POST",
                placeholderKey: "Select",
                removeTooltipKey: "Remove",
                selectPageSizeCreate: 50,
                selectPageSizeEdit: 50,
            };
        case "#FormRepeater":
            return {
                title: "Items",
                arrayField: "items",
                defaultItem: {name: "", link: ""},
                addLabel: "Add row",
                removeLabel: "Remove",
                rowTitleFields: ["name"],
                rowTitlePlaceholder: "Row",
                rowTemplate: REPEATER_ROW,
            };
        case "#FormTabbedRepeater":
            return {
                fieldPrefix: "findings",
                tabs: [
                    {key: "one", label: "One"},
                    {key: "two", label: "Two"},
                ],
                defaultItem: {name: "", link: ""},
                rowTitleFields: ["name"],
                rowTitlePlaceholder: "Row",
                addLabel: "Add row",
                removeLabel: "Remove",
                rowTemplate: REPEATER_ROW,
            };
        case "#FormAddressWithMap":
        case "#FormAddressRow":
            return {
                fieldPrefix: "address",
                countryApiUrl: "/api/auxiliary/country/select",
                stateApiUrl: "/api/auxiliary/state/select",
                cityApiUrl: "/api/auxiliary/city/select",
                apiMethod: "POST",
                mapDefaultLat: 41.3275,
                mapDefaultLng: 19.8189,
                labels: ADDRESS_LABELS,
            };
        case "#EmbeddedAddressCard":
            return {address: SAMPLE_ADDRESS_SHEET};
        case "#SheetEmbeddedItemsList":
            return {
                fields: [
                    {name: "name", type: "text", labelKey: "Name"},
                    {name: "link", type: "url", labelKey: "Link"},
                ],
                compactSummaryFields: ["name", "link"],
            };
        case "#FormMapPinPicker":
            return {
                fieldPrefix: "address",
                latField: "latitude",
                lngField: "longitude",
                defaultLat: 41.3275,
                defaultLng: 19.8189,
            };
        case "#DisplayCard":
            return {icon: "#Tag"};
        case "#CountryFlag":
            return {code: "AL", width: 40, height: 30};
        case "#Badge":
            return {children: "Active", variant: "outline"};
        case "#SheetLocationMap":
            return {addressField: "address"};
        case "#SheetMediaAvatar":
            return {nameField: "name"};
        case "#ReferencesRender":
            return {cardWidget: "#DisplayCard", pageSize: 3, hideActions: true};
        case "#GalleryCarousel":
            return {
                imageGalleryField: "media",
                mediaUrl: "https://picsum.photos/seed/",
                showThumbnails: false,
                allowFullScreen: false,
                coverAfterFirst: true,
                showPreviews: false,
            };
        default:
            return undefined;
    }
}

function sampleScalar(token: string): unknown {
    switch (token) {
        case "#Checkbox":
        case "#Switch":
            return true;
        case "#DateInput":
            return "2026-09-08";
        case "#PhoneInput":
            return "+355 69 000 0000";
        case "#IconPicker":
            return "#IconTag";
        case "#SimpleSelect":
        case "#Select":
            return "alpha";
        case "#StringArrayField":
            return ["Alpha", "Beta"];
        case "#ListingFaqsField":
            return [{question: "Who is this for?", answer: "Anyone iterating on ViewConfig widgets."}];
        case "#FormRepeater":
        case "#SheetEmbeddedItemsList":
            return [{name: "Website", link: "https://example.com"}];
        case "#SheetPriceHistoryChart":
            return [
                {
                    price: 100000,
                    currency: {symbol: "€", abbreviation: "EUR"},
                    changedAt: "2026-01-15T00:00:00.000Z",
                },
            ];
        case "#SheetModificationLineItems":
            return [{name: "Tile", amount: 12, pricePerUnit: 25}];
        case "#FormObjectIdChips":
            return [];
        case "#FormTabbedRepeater":
            return undefined;
        case "#MediaField":
        case "#MainImageField":
        case "#ImageGalleryField":
        case "#VideoGalleryField":
        case "#FormEditMediaField":
        case "#FormMultiLocalFileField":
            return [];
        case "#GalleryCarousel":
        case "#SheetMediaFilesStrip":
            return [SAMPLE_MEDIA];
        case "#SheetMediaAvatar":
            return [];
        case "#ReferencesRender":
            return [{_id: GALLERY_OBJECT_ID, name: "Sample"}];
        case "#CountryFlag":
            return "AL";
        case "#Badge":
            return "active";
        case "#Textarea":
        case "#ExpandableText":
            return "A longer sample so expandable and textarea widgets have something to wrap.";
        case "#FormAddressWithMap":
        case "#FormAddressRow":
        case "#FormMapPinPicker":
            return SAMPLE_ADDRESS_FORM;
        case "#SheetLocationMap":
        case "#EmbeddedAddressCard":
            return SAMPLE_ADDRESS_SHEET;
        default:
            return "Sample";
    }
}

function fillFieldNode(token: string, mode: "form" | "sheet"): ViewNode {
    const node = createPaletteNode(token, mode);
    const name = fieldNameFor(token);
    const extraProps = widgetPropsFor(token);
    if (!node.field) return node;
    const widgetProps = {
        ...(node.field.widgetProps ?? {}),
        ...(extraProps ?? {}),
    };
    return {
        ...node,
        field: {
            ...node.field,
            name,
            label: token.replace(/^#/, ""),
            placeholder: token.replace(/^#/, ""),
            ...(Object.keys(widgetProps).length > 0 ? {widgetProps} : {}),
        },
    };
}

function containerChildren(token: string, mode: "form" | "sheet"): ViewNode[] {
    if (token === "#FormWhenFieldValueIn") {
        return [SAMPLE_INPUT];
    }
    if (mode === "form") {
        return [SAMPLE_INPUT];
    }
    return [SAMPLE_DISPLAY];
}

function containerNode(token: string, mode: "form" | "sheet"): ViewNode {
    const node = createPaletteNode(token, mode);
    const seeded = defaultPropsFor(token) ?? {};
    const props = {...seeded, ...(node.props ?? {})};

    if (token === "#FormAlert") {
        props.message = "This is a form alert.";
    }
    if (token === "#TitleWithCollapse") {
        props.title = "Section";
    }
    if (token === "#SheetGroup") {
        props.title = "Overview";
        props.titleIcon = "#IconInfoCircle";
        props.collapseKey = "studio-gallery-sheet-group";
    }
    if (token === "#FormGrid") {
        props.columns = 1;
    }
    if (token === "#SheetGrid") {
        props.columns = 1;
    }
    if (token === "#FormWhenFieldValueIn") {
        props.watchField = "enabled";
        props.whenNonEmpty = true;
        delete props.whenValues;
    }
    if (token === "#ReferencesViewModeScope") {
        props.storageKey = "studio-gallery-refs";
        props.defaultMode = "compact";
    }

    return {
        ...node,
        props,
        children: containerChildren(token, mode),
    };
}

function chromeNode(token: string): ViewNode {
    const node = createPaletteNode(token, "form");
    const props = {...(defaultPropsFor(token) ?? {}), ...(node.props ?? {})};
    if (token === "#FormAlert") {
        props.message = "This is a form alert.";
    }
    if (token === "#ReferencesViewModeToggle") {
        return {
            render: "#SheetGroup",
            props: {
                title: "References",
                titleActions: "#ReferencesViewModeToggle",
                collapseKey: "studio-gallery-refs-toggle",
            },
            children: [SAMPLE_DISPLAY],
        };
    }
    return {...node, props};
}

function formTree(token: string): ViewNode {
    if (token === "#FormWhenFieldValueIn") {
        return {
            render: "#FormGrid",
            props: {columns: 1},
            children: [
                {
                    render: "#Field",
                    field: {name: "enabled", widget: "#Switch", label: "Enabled"},
                },
                containerNode(token, "form"),
            ],
        };
    }
    if (isContainerToken(token)) {
        return containerNode(token, "form");
    }
    if (!isFieldToken(token)) {
        return chromeNode(token);
    }
    return fillFieldNode(token, "form");
}

function sheetTree(token: string): ViewNode {
    if (isContainerToken(token)) {
        return containerNode(token, "sheet");
    }
    if (!isFieldToken(token)) {
        return chromeNode(token);
    }
    return fillFieldNode(token, "sheet");
}

function galleryConfig(viewType: "form" | "sheet", nodes: ViewNode[]): ViewConfig {
    return {
        model: GALLERY_MODEL,
        viewType,
        ...(viewType === "form" ? {viewMode: "create" as const, method: "PUT" as const} : {}),
        accessModel: GALLERY_MODEL,
        apiUrl: GALLERY_API_URL,
        nodes,
    };
}

export function formViewConfig(token: string): ViewConfig {
    return galleryConfig("form", [formTree(token)]);
}

export function sheetViewConfig(token: string): ViewConfig {
    return galleryConfig("sheet", [sheetTree(token)]);
}

export function formDefaultValues(token: string): FieldValues {
    const values: FieldValues = {};
    if (token === "#FormWhenFieldValueIn") {
        values.enabled = true;
        values.text = "Shown while the switch is on.";
        return values;
    }
    if (token === "#FormTabbedRepeater") {
        values.findings = {
            one: [{name: "First", link: "https://example.com"}],
            two: [],
        };
        return values;
    }
    if (
        token === "#FormAddressWithMap" ||
        token === "#FormAddressRow" ||
        token === "#FormMapPinPicker"
    ) {
        values.address = sampleScalar("#FormAddressWithMap");
        return values;
    }
    if (!isFieldToken(token) || isContainerToken(token)) {
        if (token === "#FormGrid" || token === "#TitleWithCollapse") {
            values.text = "Sample";
        }
        return values;
    }
    const name = fieldNameFor(token);
    const sample = sampleScalar(token);
    if (sample !== undefined) {
        values[name] = sample;
    }
    return values;
}

export function sheetRow(token: string): SampleRow {
    const row: SampleRow = {
        _id: GALLERY_OBJECT_ID,
        name: "Sample",
    };
    if (isContainerToken(token) || !isFieldToken(token)) {
        return row;
    }
    const name = fieldNameFor(token);
    const sample = sampleScalar(token);
    if (sample !== undefined) {
        row[name] = sample;
    }
    if (token === "#SheetMediaAvatar") {
        row.media = GALLERY_OBJECT_ID;
    }
    return row;
}

/**
 * One entry per registered `#` widget the palette would offer.
 *
 * HTML tags are skipped — they are not form/sheet renders. Overlay tokens still appear
 * so the gallery covers every registry token, but they are opened on demand.
 */
export function listGalleryEntries(): GalleryEntry[] {
    const groups = buildPaletteGroups();
    const entries: GalleryEntry[] = [];

    for (const group of groups) {
        if (group.id === "html") continue;
        for (const token of group.tokens) {
            if (!token.startsWith("#")) continue;
            entries.push({
                token,
                groupId: group.id,
                groupLabel: group.label,
                ...classifyGalleryToken(token),
            });
        }
    }

    return entries;
}
