import {createElement, lazy} from "react";
import type {WidgetContribution} from "@coreModule/helpers/types/widgetContribution.types.ts";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Textarea} from "@coreModule/components/ui/textarea.tsx";
import {Checkbox} from "@coreModule/components/ui/checkbox.tsx";
import {Switch} from "@coreModule/components/ui/switch.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import DisplayCard from "@coreModule/components/viewEngine/widgets/display/displayCard.tsx";
import CountryFlag from "@coreModule/components/viewEngine/widgets/display/countryFlag.tsx";
import ExpandableText from "@coreModule/components/viewEngine/widgets/display/expandableText.tsx";
import {ApiSelect} from "@coreModule/components/viewEngine/widgets/inputs/apiSelect/apiSelect.tsx";
import {SimpleSelect} from "@coreModule/components/viewEngine/widgets/inputs/simpleSelect.tsx";
import {DateInput} from "@coreModule/components/custom/inputs/dateInput.tsx";
import {StringArrayInput} from "@coreModule/components/custom/inputs/stringArrayInput.tsx";
import {ListingFaqsField} from "@coreModule/components/viewEngine/widgets/repeaters/listingFaqsField.tsx";
import {IconPickerInput} from "@coreModule/components/custom/inputs/iconPickerInput.tsx";
import {PhoneInput} from "@coreModule/components/custom/inputs/phoneInput.tsx";
import {GalleryCarousel} from "@coreModule/components/viewEngine/widgets/gallery/galleryCarousel.tsx";
import TitleWithCollapse from "@coreModule/components/custom/titleWithCollapse.tsx";
import {MainImageField} from "@coreModule/components/viewEngine/widgets/gallery/mainImageField.tsx";
import {ImageGalleryField} from "@coreModule/components/viewEngine/widgets/gallery/imageGalleryField.tsx";
import {VideoGalleryField} from "@coreModule/components/viewEngine/widgets/gallery/videoGalleryField.tsx";
import MediaField from "@coreModule/components/viewEngine/widgets/media/mediaField.tsx";
import FormAddressWithMap, {SingleFormAddressWithMap} from "@coreModule/components/viewEngine/widgets/addresses/formAddressWithMap.tsx";
import FormMapPinPicker from "@coreModule/components/viewEngine/widgets/addresses/formMapPinPicker.tsx";
import FormRepeater from "@coreModule/components/viewEngine/widgets/repeaters/formRepeater.tsx";
import FormTabbedRepeater from "@coreModule/components/viewEngine/widgets/repeaters/formTabbedRepeater.tsx";
import {ObjectIdChipsInput} from "@coreModule/components/custom/inputs/objectIdChipsInput.tsx";
import FormEditMediaField from "@coreModule/components/viewEngine/widgets/media/formEditMediaField.tsx";
import FormMultiLocalFileField from "@coreModule/components/viewEngine/widgets/media/formMultiLocalFileField.tsx";
import SheetLocationMap from "@coreModule/components/viewEngine/widgets/addresses/sheetLocationMap.tsx";
import {FormWhenFieldValueIn} from "@coreModule/components/viewEngine/widgets/layout/form/whenFieldValueIn.tsx";
import {SheetGrid} from "@coreModule/components/viewEngine/widgets/layout/sheet/grid.tsx";
import {FormAlert} from "@coreModule/components/viewEngine/widgets/layout/form/alert.tsx";
import {FormTotal} from "@coreModule/components/viewEngine/widgets/layout/form/total.tsx";
import {FormGrid} from "@coreModule/components/viewEngine/widgets/layout/form/grid.tsx";
import {SheetGroup} from "@coreModule/components/viewEngine/widgets/layout/sheet/group.tsx";
import SheetMediaFilesStrip from "../sheet/widgets/sheetMediaFilesStrip.tsx";
import SheetMediaAvatar from "../sheet/widgets/sheetMediaAvatar.tsx";
import WeeklyHours from "../sheet/widgets/weeklyHours.tsx";
import SheetEmbeddedItemsList from "../sheet/widgets/embeddedItems/sheetEmbeddedItemsList.tsx";
import SheetEmbeddedAddressCard from "../sheet/widgets/addresses/sheetEmbeddedAddressCard.tsx";
import {ReferencesViewModeScope} from "../sheet/widgets/references/referencesViewModeContext.tsx";
import ReferencesViewModeToggle from "../sheet/widgets/references/referencesViewModeToggle.tsx";
import {CORE_WIDGET_META} from "../widgetMeta.ts";
import {CORE_DEFAULT_COMPOUND_FORM_WIDGETS, coreCompoundFormWidgetRenderers} from "../form/widgets/compound.tsx";
import {sheetFieldVisible} from "../engine/nodeGates.ts";
import CronJobRuns from "@coreModule/clients/panel/private/tenancy/systemSettings/cronJobs/center/sheetView/cronJobRuns.tsx";
import type {CronJob} from "armonia/src/modules/core/api/auxiliary/private/cronJob/cronJob.dto.ts";

const CurrencySheetViewLazy = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/currencies/center/sheetView/currencySheetView.tsx"));
const CountrySheetViewLazy = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/sheetView/countrySheetView.tsx"));
const CompanySheetViewLazy = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/sheetView/companySheetView.tsx"));
const UserAddressSheetViewLazy = lazy(() => import("@coreModule/clients/panel/private/accountSettings/addresses/center/sheetView/userAddressSheetView.tsx"));
const CountryCardLazy = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/cardView/countryCard.tsx"));
const StateSheetViewLazy = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/states/center/sheetView/stateSheetView.tsx"));
const StateCardLazy = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/states/center/cardView/stateCard.tsx"));
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
/** Sheets a record shared in chat opens by token, named by each sheet view's `sheetWidget` (D162). */
const RoleSheetViewLazy = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/roles/center/sheetView/roleSheetView.tsx"));
const BlogCategorySheetViewLazy = lazy(() => import("@coreModule/clients/panel/private/blogCategories/center/sheetView/blogCategorySheetView.tsx"));
const CronJobSheetViewLazy = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/cronJobs/center/sheetView/cronJobSheetView.tsx"));
const SmtpServerSheetViewLazy = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/smtpServers/center/sheetView/smtpServerSheetView.tsx"));
const UserSessionSheetViewLazy = lazy(() => import("@coreModule/clients/panel/private/accountSettings/security/userSession/center/sheetView/userSessionSheetView.tsx"));
const LoginHistorySheetViewLazy = lazy(() => import("@coreModule/clients/panel/private/accountSettings/security/loginHistory/center/sheetView/loginHistorySheetView.tsx"));
const MessagingProviderSheetViewLazy = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/messagingProviders/center/sheetView/messagingProviderSheetView.tsx"));
const BlogPostSheetViewLazy = lazy(() => import("@coreModule/clients/panel/private/blogPosts/center/sheetView/blogPostSheetView.tsx"));
const ContentReportSheetViewLazy = lazy(() => import("@coreModule/clients/panel/private/tenancy/reports/reportSheetView.tsx"));

export function getCoreWidgetContribution(): WidgetContribution {
    return {
        id: "core",
        order: 0,
        widgets: {
            "#RoleSheetView": RoleSheetViewLazy,
            "#BlogCategorySheetView": BlogCategorySheetViewLazy,
            "#CronJobSheetView": CronJobSheetViewLazy,
            "#SmtpServerSheetView": SmtpServerSheetViewLazy,
            "#UserSessionSheetView": UserSessionSheetViewLazy,
            "#LoginHistorySheetView": LoginHistorySheetViewLazy,
            "#MessagingProviderSheetView": MessagingProviderSheetViewLazy,
            "#BlogPostSheetView": BlogPostSheetViewLazy,
            "#ContentReportSheetView": ContentReportSheetViewLazy,
            "#SheetGrid": SheetGrid,
            "#FormGrid": FormGrid,
            "#FormAlert": FormAlert,
            /** Form display: a total built from other fields as they are typed, in its record's currency (TD-F74). */
            "#FormTotal": FormTotal,
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
            "#StringArrayInput": StringArrayInput,
            "#ListingFaqsField": ListingFaqsField,
            "#IconPickerInput": IconPickerInput,
            "#PhoneInput": PhoneInput,
            "#GalleryCarousel": GalleryCarousel,
            /** Sheet read-only: `media[]` as a row of `SingleFile` tiles (no carousel). */
            "#SheetMediaFilesStrip": SheetMediaFilesStrip,
            /** Sheet read-only: configurable embedded `{field}[]` list; cards = full fields, compact = summary text only. Pair with `#ReferencesViewModeScope`. */
            "#SheetEmbeddedItemsList": SheetEmbeddedItemsList,
            /** Sheet read-only: logo-style `Avatar` for a single media id (string or populated `{ _id }`). */
            "#SheetMediaAvatar": SheetMediaAvatar,
            "#WeeklyHours": WeeklyHours,
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
            "#ObjectIdChipsInput": ObjectIdChipsInput,
            "#FormMultiLocalFileField": FormMultiLocalFileField,
            "#FormEditMediaField": FormEditMediaField,
            "#SheetLocationMap": SheetLocationMap,
            "#ReferencesViewModeScope": ReferencesViewModeScope,
            "#ReferencesViewModeToggle": ReferencesViewModeToggle,
            "#CurrencySheetView": CurrencySheetViewLazy,
            "#CountrySheetView": CountrySheetViewLazy,
            /** `#ReferencesRender` card for country stubs (pairs with `#CountrySheetView`). */
            "#CountryCard": CountryCardLazy,
            "#StateSheetView": StateSheetViewLazy,
            /** `#ReferencesRender` card for state stubs (pairs with `#StateSheetView`). */
            "#StateCard": StateCardLazy,
            "#CitySheetView": CitySheetViewLazy,
            /** A company opened from a reference (who requested a platform list entry); loads through `/api/companies/single`. */
            "#CompanySheetView": CompanySheetViewLazy,
            "#UserAddressSheetView": UserAddressSheetViewLazy,
        },
        sheetFieldRenderers: {
            /** The scheduled action's next runs and run history, placed by the view above Lifecycle (UX-03, TD-F67). */
            "#CronJobRuns": ({node, ctx, index}) => {
                const {data} = ctx;
                if (!data || typeof data._id !== "string" || !sheetFieldVisible(node, ctx)) return null;
                return createElement(CronJobRuns, {key: index, job: data as CronJob, resolveLanguageKey: ctx.resolveLanguageKey});
            },
        },
        widgetMeta: CORE_WIDGET_META,
        compoundFormWidgets: CORE_DEFAULT_COMPOUND_FORM_WIDGETS,
        compoundFormWidgetRenderers: coreCompoundFormWidgetRenderers,
        formWriteAccessKeys: {"#FormEditMediaField": "media"},
        referencesDefaultItemProps: {
            "#CountryCard": "country",
            "#StateCard": "state",
        },
        auditSinglePostHints: {
            "#CurrencySheetView": CURRENCY_SINGLE,
            "#CountrySheetView": COUNTRY_SINGLE,
            "#CountryCard": COUNTRY_SINGLE,
            "#StateSheetView": STATE_SINGLE,
            "#StateCard": STATE_SINGLE,
            "#CitySheetView": CITY_SINGLE,
            "#TenancyCountryCard": COUNTRY_SINGLE,
            "#TenancyStateCard": STATE_SINGLE,
            "#TenancyCityCard": CITY_SINGLE,
            "#TenancyCurrencyCard": CURRENCY_SINGLE,
        },
        /** Create pages an `#ApiSelect` on `<apiUrl>/select` opens in a dialog ("Create new …" below the dropdown). */
        createPages: {
            "/api/auxiliary/blogCategory": lazy(() => import("@coreModule/clients/panel/private/blogCategories/createBlogCategory.tsx")),
            "/api/auxiliary/city": lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/cities/createCity.tsx")),
            "/api/auxiliary/country": lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/countries/createCountry.tsx")),
            "/api/auxiliary/state": lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/states/createState.tsx")),
            "/api/finance/currency": lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/currencies/createCurrency.tsx")),
        },
    };
}
