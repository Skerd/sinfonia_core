import {lazy, type ComponentType} from "react";
import * as TablerIcons from "@tabler/icons-react";

import {Input} from "@coreModule/components/ui/input.tsx";
import {Textarea} from "@coreModule/components/ui/textarea.tsx";
import {Checkbox} from "@coreModule/components/ui/checkbox.tsx";
import {Switch} from "@coreModule/components/ui/switch.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import SmallInfoCard from "@coreModule/components/custom/smallInfoCard.tsx";
import CountryFlag from "@coreModule/components/custom/countryFlag.tsx";
import ExpandableText from "@coreModule/components/custom/expandableText.tsx";
import {ApiSelect} from "@coreModule/components/custom/apiSelect";
import {SimpleSelect} from "@coreModule/components/custom/simpleSelect";
import {DateInput} from "@coreModule/components/custom/dateInput.tsx";
import {StringArrayField} from "@coreModule/components/custom/stringArrayField.tsx";
import {ListingFaqsField} from "@coreModule/components/custom/listingFaqsField.tsx";
import {IconPicker} from "@coreModule/components/custom/iconPicker.tsx";
import {PhoneInput} from "@coreModule/components/custom/phoneInput.tsx";
import {GalleryCarousel} from "@coreModule/components/custom/images/galleryCarousel.tsx";
import SheetMediaFilesStrip from "./sheetMediaFilesStrip.tsx";
import SheetModificationLineItems from "./sheetModificationLineItems.tsx";
import SheetMediaAvatar from "./sheetMediaAvatar.tsx";
import SheetEmbeddedItemsList from "./sheetEmbeddedItemsList.tsx";
import SheetEmbeddedAddressCard from "./sheetEmbeddedAddressCard.tsx";
import TitleWithCollapse from "@coreModule/components/custom/titleWithCollapse.tsx";
import {ReferencesViewModeScope} from "./referencesViewModeContext.tsx";
import ReferencesViewModeToggle from "./referencesViewModeToggle.tsx";
import {MainImageField} from "@coreModule/components/custom/images/mainImageField.tsx";
import {ImageGalleryField} from "@coreModule/components/custom/images/imageGalleryField.tsx";
import {VideoGalleryField} from "@coreModule/components/custom/images/videoGalleryField.tsx";
import MediaField from "@coreModule/components/custom/files/mediaField.tsx";
import FormAddressWithMap, {SingleFormAddressWithMap} from "@coreModule/components/custom/addresses/formAddressWithMap.tsx";
import FormMapPinPicker from "@coreModule/components/custom/addresses/formMapPinPicker.tsx";
import FormRepeater from "@coreModule/components/custom/formRepeater.tsx";
import FormTabbedRepeater from "@coreModule/components/custom/formTabbedRepeater.tsx";
import FormObjectIdChips from "@coreModule/components/custom/formObjectIdChips.tsx";
import FormEditMediaField from "@coreModule/components/custom/files/formEditMediaField.tsx";
import FormMultiLocalFileField from "@coreModule/components/custom/files/formMultiLocalFileField.tsx";
import SheetLocationMap from "@coreModule/components/custom/addresses/sheetLocationMap.tsx";
import {FormWhenFieldValueIn} from "../custom/renderEngine/layout/form/whenFieldValueIn.tsx";
import {SheetGrid} from "@coreModule/components/custom/renderEngine/layout/sheet/grid.tsx";
import {FormAlert} from "@coreModule/components/custom/renderEngine/layout/form/alert.tsx";
import {FormGrid} from "@coreModule/components/custom/renderEngine/layout/form/grid.tsx";
import {SheetGroup} from "@coreModule/components/custom/renderEngine/layout/sheet/group.tsx";
import type {AuditSinglePostHint,SheetFieldRenderer} from "@coreModule/clients/panel/moduleContributions/widgetContribution.types.ts";
import {getSortedWidgetContributions} from "@coreModule/clients/panel/moduleContributions/loadWidgetContributions.ts";

const CurrencySheetViewLazy = lazy(() =>import("@coreModule/clients/panel/private/tenancy/systemSettings/currencies/center/sheetView/currencySheetView.tsx"));
const CountrySheetViewLazy = lazy(() =>import("@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/sheetView/countrySheetView.tsx"));
const StateSheetViewLazy = lazy(() =>import("@coreModule/clients/panel/private/tenancy/systemSettings/states/center/sheetView/stateSheetView.tsx"));
const CitySheetViewLazy = lazy(() =>import("@coreModule/clients/panel/private/tenancy/systemSettings/cities/center/sheetView/citySheetView.tsx"));

/** Core-owned widgets only. Domain modules register via `clients/panel/widgetContribution`. */
const WIDGET_REGISTRY: Record<string, ComponentType<any>> = {
    "#SheetGrid": SheetGrid,
    "#FormGrid": FormGrid,
    "#FormAlert": FormAlert,
    "#SheetGroup": SheetGroup,
    "#Input": Input,
    "#Textarea": Textarea,
    "#Checkbox": Checkbox,
    "#Switch": Switch,
    "#Badge": Badge,
    "#SmallInfoCard": SmallInfoCard,
    "#CountryFlag": CountryFlag,
    "#ExpandableText": ExpandableText,
    "#ApiSelect": ApiSelect,
    "#SimpleSelect": SimpleSelect,
    "#DateInput": DateInput,
    "#StringArrayField": StringArrayField,
    "#ListingFaqsField": ListingFaqsField,
    "#IconPicker": IconPicker,
    "#PhoneInput": PhoneInput,
    "#GalleryCarousel": GalleryCarousel,
    /** Sheet read-only: `media[]` as a row of `SingleFile` tiles (no carousel). */
    "#SheetMediaFilesStrip": SheetMediaFilesStrip,
    /** Sheet read-only: configurable embedded `{field}[]` list; cards = full fields, compact = summary text only. Pair with `#ReferencesViewModeScope`. */
    "#SheetEmbeddedItemsList": SheetEmbeddedItemsList,
    /** Sheet read-only: engineer `materialsPlan[]` or finance `costBreakdown[]` line items. */
    "#SheetModificationLineItems": SheetModificationLineItems,
    /** Sheet read-only: logo-style `Avatar` for a single media id (string or populated `{ _id }`). */
    "#SheetMediaAvatar": SheetMediaAvatar,
    /** `#ReferencesRender` card for a single embedded address (non-compact/cards mode). */
    "#EmbeddedAddressCard": SheetEmbeddedAddressCard,
    "#TitleWithCollapse": TitleWithCollapse,
    "#MainImageField": MainImageField,
    "#ImageGalleryField": ImageGalleryField,
    "#VideoGalleryField": VideoGalleryField,
    "#MediaField": MediaField,

    "#FormWhenFieldValueIn": FormWhenFieldValueIn,
    "#FormAddressWithMap": FormAddressWithMap,
    "#FormAddressRow": SingleFormAddressWithMap,
    "#FormMapPinPicker": FormMapPinPicker,
    "#FormRepeater": FormRepeater,
    "#FormTabbedRepeater": FormTabbedRepeater,
    "#FormObjectIdChips": FormObjectIdChips,
    "#FormMultiLocalFileField": FormMultiLocalFileField,
    "#FormEditMediaField": FormEditMediaField,
    "#SheetLocationMap": SheetLocationMap,
    "#ReferencesViewModeScope": ReferencesViewModeScope as ComponentType<any>,
    "#ReferencesViewModeToggle": ReferencesViewModeToggle,
    "#CurrencySheetView": CurrencySheetViewLazy,
    "#CountrySheetView": CountrySheetViewLazy,
    "#StateSheetView": StateSheetViewLazy,
    "#CitySheetView": CitySheetViewLazy,
};

/** Default prop name for `#ReferencesRender` when `itemDataProp` is omitted. */
const REFERENCES_DEFAULT_ITEM_PROP: Record<string, string> = {};

/** Custom sheet-mode field branches contributed by modules. */
const SHEET_FIELD_RENDERERS: Record<string, SheetFieldRenderer> = {};

/** Audit `singlePost` hints contributed by modules (+ core tenancy defaults). */
const AUDIT_SINGLE_POST_HINTS: Record<string, AuditSinglePostHint> = {
    "#CurrencySheetView": {url: "/api/finance/currency/single", labelFields: ["name", "abbreviation", "symbol"]},
    "#CountrySheetView": {url: "/api/auxiliary/country/single", labelFields: ["name"]},
    "#StateSheetView": {url: "/api/auxiliary/state/single", labelFields: ["name"]},
    "#CitySheetView": {url: "/api/auxiliary/city/single", labelFields: ["name"]},
    "#TenancyCountryCard": {url: "/api/auxiliary/country/single", labelFields: ["name"]},
    "#TenancyStateCard": {url: "/api/auxiliary/state/single", labelFields: ["name"]},
    "#TenancyCityCard": {url: "/api/auxiliary/city/single", labelFields: ["name"]},
    "#TenancyCurrencyCard": {url: "/api/finance/currency/single", labelFields: ["name", "abbreviation", "symbol"]},
};

let contributionsStatus: "idle" | "applying" | "done" = "idle";

/**
 * Lazily apply module `widgetContribution` files.
 * Re-entrant during circular init (card → sheet → ViewRenderer → resolveWidget): uses
 * whatever has already been merged; finishes on the outermost call.
 */
function ensureContributionsApplied(): void {
    if (contributionsStatus === "done" || contributionsStatus === "applying") {
        return;
    }
    contributionsStatus = "applying";

    for (const contribution of getSortedWidgetContributions()) {
        if (contribution.widgets) {
            for (const [token, component] of Object.entries(contribution.widgets)) {
                WIDGET_REGISTRY[token] = component;
            }
        }
        if (contribution.referencesDefaultItemProps) {
            for (const [token, prop] of Object.entries(contribution.referencesDefaultItemProps)) {
                REFERENCES_DEFAULT_ITEM_PROP[token] = prop;
            }
        }
        if (contribution.sheetFieldRenderers) {
            for (const [token, renderer] of Object.entries(contribution.sheetFieldRenderers)) {
                SHEET_FIELD_RENDERERS[token] = renderer;
            }
        }
        if (contribution.auditSinglePostHints) {
            for (const [token, hint] of Object.entries(contribution.auditSinglePostHints)) {
                AUDIT_SINGLE_POST_HINTS[token] = hint;
            }
        }
    }

    contributionsStatus = "done";
}

export function getRegisteredWidgetTokens(): string[] {
    ensureContributionsApplied();
    return Object.keys(WIDGET_REGISTRY);
}

/** Icons from view configs (`widgetProps.icon` / header badges). Tabler forwardRef components. */
export type ViewConfigIcon = ComponentType<{className?: string}>;

function isTablerIconExport(v: unknown): v is ViewConfigIcon {
    return (
        typeof v === "object" &&
        v !== null &&
        typeof (v as {render?: unknown}).render === "function"
    );
}

/**
 * Lucide-style / legacy view-config names → `@tabler/icons-react` export names.
 * Tokens that already match Tabler (`#IconLabel` → `IconLabel`) or `Icon` + PascalCase (`#Tag` → `IconTag`) need no entry.
 */
const LEGACY_TO_TABLER_EXPORT: Record<string, string> = {
    Accessibility: "IconAccessible",
    /** Lucide `AlarmClock`; Tabler exposes `IconAlarm` / `IconAlarmSnooze`, not `IconAlarmClock`. */
    AlarmClock: "IconAlarm",
    ArrowUpDown: "IconArrowsUpDown",
    Banknote: "IconCashBanknote",
    BedDouble: "IconBed",
    BookMarked: "IconBookmark",
    Building2: "IconBuildingCommunity",
    CheckCircle: "IconCircleCheck",
    DollarSign: "IconCurrencyDollar",
    DoorOpen: "IconDoor",
    Droplets: "IconDroplet",
    /** Lucide `FolderTree`; Tabler uses hierarchy / multi-folder icons. */
    FolderTree: "IconFolders",
    Globe: "IconWorld",
    Landmark: "IconBuildingMonument",
    Layers: "IconStack",
    ListOrdered: "IconListNumbers",
    MessageSquare: "IconMessage",
    Percent: "IconPercentage",
    ShieldAlert: "IconShieldExclamation",
    TreePine: "IconTrees",
    Waves: "IconRipple",
    XCircle: "IconCircleX",
};

function viewConfigIconTokenToExportName(raw: string): string {
    const mapped = LEGACY_TO_TABLER_EXPORT[raw];
    if (mapped) return mapped;
    if (raw.startsWith("Icon")) return raw;
    return `Icon${raw}`;
}

/** Runtime overrides from `registerIcon` (takes precedence over Tabler lookup). */
const ICON_OVERRIDES: Record<string, ViewConfigIcon> = {};

/**
 * Resolves `#…` strings from view configs to Tabler icon components.
 *
 * Uses a namespace import and runtime property access, so bundlers typically cannot tree-shake unused icons
 * (unlike `import { IconX } from "@tabler/icons-react"`). Prefer this for ergonomics; use explicit imports
 * only if bundle size for this chunk is critical.
 */
export function resolveIcon(token: string): ViewConfigIcon | null {
    const registered = ICON_OVERRIDES[token];
    if (registered) return registered;

    if (!token || typeof token !== "string") return null;
    const raw = token.startsWith("#") ? token.slice(1) : token;
    if (!raw) return null;

    const exportName = viewConfigIconTokenToExportName(raw);
    const candidate = TablerIcons[exportName as keyof typeof TablerIcons];
    return isTablerIconExport(candidate) ? candidate : null;
}

export function resolveWidget(token: string): ComponentType<any> | null {
    ensureContributionsApplied();
    return WIDGET_REGISTRY[token] ?? null;
}

export function registerWidget(token: string, component: ComponentType<any>): void {
    WIDGET_REGISTRY[token] = component;
}

export function registerIcon(token: string, icon: ViewConfigIcon): void {
    ICON_OVERRIDES[token] = icon;
}

export function registerReferencesDefaultItemProp(token: string, itemDataProp: string): void {
    REFERENCES_DEFAULT_ITEM_PROP[token] = itemDataProp;
}

export function getReferencesDefaultItemProp(token: string): string | undefined {
    ensureContributionsApplied();
    return REFERENCES_DEFAULT_ITEM_PROP[token];
}

export function registerSheetFieldRenderer(token: string, renderer: SheetFieldRenderer): void {
    SHEET_FIELD_RENDERERS[token] = renderer;
}

export function getSheetFieldRenderer(token: string): SheetFieldRenderer | undefined {
    ensureContributionsApplied();
    return SHEET_FIELD_RENDERERS[token];
}

export function registerAuditSinglePostHint(token: string, hint: AuditSinglePostHint): void {
    AUDIT_SINGLE_POST_HINTS[token] = hint;
}

export function getAuditSinglePostHint(token: string): AuditSinglePostHint | undefined {
    ensureContributionsApplied();
    return AUDIT_SINGLE_POST_HINTS[token];
}
