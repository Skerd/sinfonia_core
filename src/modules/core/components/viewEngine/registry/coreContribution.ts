import {lazy} from "react";
import type {WidgetContribution} from "@coreModule/clients/panel/moduleContributions/widgetContribution.types.ts";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Textarea} from "@coreModule/components/ui/textarea.tsx";
import {Checkbox} from "@coreModule/components/ui/checkbox.tsx";
import {Switch} from "@coreModule/components/ui/switch.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import DisplayCard from "@coreModule/components/custom/displayValue/displayCard.tsx";
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
import TitleWithCollapse from "@coreModule/components/custom/titleWithCollapse.tsx";
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
import {FormWhenFieldValueIn} from "@coreModule/components/custom/renderEngine/layout/form/whenFieldValueIn.tsx";
import {SheetGrid} from "@coreModule/components/custom/renderEngine/layout/sheet/grid.tsx";
import {FormAlert} from "@coreModule/components/custom/renderEngine/layout/form/alert.tsx";
import {FormGrid} from "@coreModule/components/custom/renderEngine/layout/form/grid.tsx";
import {SheetGroup} from "@coreModule/components/custom/renderEngine/layout/sheet/group.tsx";
import SheetMediaFilesStrip from "../sheet/widgets/sheetMediaFilesStrip.tsx";
import SheetMediaAvatar from "../sheet/widgets/sheetMediaAvatar.tsx";
import SheetEmbeddedItemsList from "../sheet/widgets/embeddedItems/sheetEmbeddedItemsList.tsx";
import SheetEmbeddedAddressCard from "../sheet/widgets/addresses/sheetEmbeddedAddressCard.tsx";
import {ReferencesViewModeScope} from "../sheet/widgets/references/referencesViewModeContext.tsx";
import ReferencesViewModeToggle from "../sheet/widgets/references/referencesViewModeToggle.tsx";
import {CORE_WIDGET_META} from "../widgetMeta.ts";
import {CORE_DEFAULT_COMPOUND_FORM_WIDGETS, coreCompoundFormWidgetRenderers} from "../form/widgets/compound.tsx";

const CurrencySheetViewLazy = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/currencies/center/sheetView/currencySheetView.tsx"));
const CountrySheetViewLazy = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/sheetView/countrySheetView.tsx"));
const StateSheetViewLazy = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/states/center/sheetView/stateSheetView.tsx"));
const CitySheetViewLazy = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/cities/center/sheetView/citySheetView.tsx"));

const COUNTRY_SINGLE = {url: "/api/auxiliary/country/single", labelFields: ["name"]};
const STATE_SINGLE = {url: "/api/auxiliary/state/single", labelFields: ["name"]};
const CITY_SINGLE = {url: "/api/auxiliary/city/single", labelFields: ["name"]};
const CURRENCY_SINGLE = {url: "/api/finance/currency/single", labelFields: ["name", "abbreviation", "symbol"]};

/**
 * Core's own widgets, described the same way modules describe theirs. `widgetRegistry`
 * merges it before any module contribution, so a module can override a core token.
 *
 * A function, not a constant: the registry calls it on first use, after every import in
 * the card → sheet → renderer → registry cycle has finished evaluating.
 */
export function getCoreWidgetContribution(): WidgetContribution {
    return {
        id: "core",
        order: 0,
        widgets: {
            "#SheetGrid": SheetGrid,
            "#FormGrid": FormGrid,
            "#FormAlert": FormAlert,
            "#SheetGroup": SheetGroup,
            "#Input": Input,
            "#Textarea": Textarea,
            "#Checkbox": Checkbox,
            "#Switch": Switch,
            "#Badge": Badge,
            "#DisplayCard": DisplayCard,
            "#CountryFlag": CountryFlag,
            "#ExpandableText": ExpandableText,
            "#ApiSelect": ApiSelect,
            "#SimpleSelect": SimpleSelect,
            "#Select": SimpleSelect,
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
            "#ReferencesViewModeScope": ReferencesViewModeScope,
            "#ReferencesViewModeToggle": ReferencesViewModeToggle,
            "#CurrencySheetView": CurrencySheetViewLazy,
            "#CountrySheetView": CountrySheetViewLazy,
            "#StateSheetView": StateSheetViewLazy,
            "#CitySheetView": CitySheetViewLazy,
        },
        widgetMeta: CORE_WIDGET_META,
        compoundFormWidgets: CORE_DEFAULT_COMPOUND_FORM_WIDGETS,
        compoundFormWidgetRenderers: coreCompoundFormWidgetRenderers,
        formWriteAccessKeys: {"#FormEditMediaField": "media"},
        auditSinglePostHints: {
            "#CurrencySheetView": CURRENCY_SINGLE,
            "#CountrySheetView": COUNTRY_SINGLE,
            "#StateSheetView": STATE_SINGLE,
            "#CitySheetView": CITY_SINGLE,
            "#TenancyCountryCard": COUNTRY_SINGLE,
            "#TenancyStateCard": STATE_SINGLE,
            "#TenancyCityCard": CITY_SINGLE,
            "#TenancyCurrencyCard": CURRENCY_SINGLE,
        },
    };
}
