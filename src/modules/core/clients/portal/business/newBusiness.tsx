import {useEffect, useMemo, useState, type FormEvent} from "react";
import {Link, useSearchParams} from "react-router-dom";
import {compose} from "redux";
import {toast} from "sonner";
import {IconArrowLeft, IconCircleCheck, IconCurrentLocation, IconExternalLink, IconPhotoPlus} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {handleError} from "@coreModule/helpers/general/errors.ts";
import SinglePinMap from "@coreModule/components/viewEngine/widgets/addresses/mapWithPins.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Label} from "@coreModule/components/ui/label.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {NativeSelect} from "@coreModule/components/ui/native-select.tsx";
import {RadioGroup, RadioGroupItem} from "@coreModule/components/ui/radio-group.tsx";
import {usePortalSession} from "@coreModule/clients/portal/shared/portalSession.tsx";
import {usePortalSite} from "@coreModule/clients/portal/shared/portalSiteContext.tsx";
import {usePortalTitle} from "@coreModule/clients/portal/shared/portalTitle.ts";
import {companySiteOrigin} from "@coreModule/clients/portal/shared/portalZone.ts";
import {getPortalContributions, portalBusinessTypesOf} from "@coreModule/helpers/moduleContributions/loadPortalContributions.ts";
import {isValidSiteSlug, resolveSiteSlug} from "armonia/src/modules/core/api/company/private/company/siteSlug.ts";
import type {
    SelfServeBusinessCreated,
    SelfServeBusinessCreatedResponse,
} from "armonia/src/modules/core/api/portal/private/business/selfServeBusiness.dto.ts";

const LANGUAGE_PATH = "src/modules/core/clients/portal/business/newBusiness.tsx";

type PortalCountry = {_id: string; name: string; code: string};
type PortalCity = {_id: string; name: string};

/** Where the map opens before the business drops its pin (the same default as posting a job). */
const DEFAULT_PIN = {lat: 41.3275, lng: 19.8187};

const COUNTRIES_REQUEST: HttpRequest = {method: "GET", url: "/api/portal/places/countries", cache: true};
const CITIES_REQUEST: HttpRequest = {method: "POST", url: "/api/portal/places/cities", cache: true};
const CREATE_BUSINESS_REQUEST: HttpRequest = {method: "PUT", url: "/api/portal/business"};

/** The panel's sign-in, with the person's account filled in (D178: a plain sign-in lands in the new business). */
function panelSignInUrl(panelUrl: string, username: string): string {
    return `${panelUrl}/authenticate/login?username=${encodeURIComponent(username)}`;
}

/**
 * Self-serve business sign-up (D178): a signed-in person picks the kind of business, says who and where it is, and gets
 * its own site at once; the portal apex lists it after the platform's check.
 */
function NewBusinessPage({resolveLanguageKey}: WithLanguageType) {
    const [searchParams] = useSearchParams();
    const {user} = usePortalSession();
    const {site} = usePortalSite();
    const brand = site?.company.name ?? "";
    const businessTypes = useMemo(() => portalBusinessTypesOf(getPortalContributions()), []);
    const requestedType = searchParams.get("type") ?? "";
    // The company site whose "Powered by" link brought the person (P23.9); an edited link is dropped, not sent.
    const requestedRef = searchParams.get("ref");
    const ref = requestedRef && isValidSiteSlug(requestedRef) ? requestedRef : undefined;
    const businessHref = ref ? `/business?ref=${encodeURIComponent(ref)}` : "/business";
    const [businessType, setBusinessType] = useState(businessTypes.some(({key}) => key === requestedType) ? requestedType : "");
    const [form, setForm] = useState({
        name: "",
        phoneNumber: user.phoneNumber ?? "",
        vat: "",
        siteSlug: "",
        street: "",
        postalCode: "",
        country: "",
        city: "",
    });
    const [pin, setPin] = useState<{lat: number; lng: number} | null>(null);
    const [logo, setLogo] = useState<File | null>(null);
    const [created, setCreated] = useState<SelfServeBusinessCreated | null>(null);

    const countryList = useHttpRequest<{data: PortalCountry[]}>(COUNTRIES_REQUEST, {}, 1);
    const countries: PortalCountry[] = countryList.data?.data ?? [];
    const [citiesCount, setCitiesCount] = useState(0);
    useEffect(() => {
        if (form.country) setCitiesCount((count) => count + 1);
    }, [form.country]);
    const cityList = useHttpRequest<{data: PortalCity[]}>(CITIES_REQUEST, {countryId: form.country}, citiesCount);
    const cities: PortalCity[] = form.country && !cityList.error ? cityList.data?.data ?? [] : [];

    const [createCall, setCreateCall] = useState<{form: FormData; count: number}>(() => ({form: new FormData(), count: 0}));
    const createRequest = useHttpRequest<SelfServeBusinessCreatedResponse>(CREATE_BUSINESS_REQUEST, createCall.form, createCall.count, true, {
        success: (response) => {
            setCreated(response.data);
            window.scrollTo({top: 0});
        },
        error: (err) => handleError(err, {context: "NewBusiness", showToast: true, fallbackMessage: resolveLanguageKey("submitError")}),
    });

    const logoPreview = useMemo(() => (logo ? URL.createObjectURL(logo) : undefined), [logo]);
    useEffect(() => () => {
        if (logoPreview) URL.revokeObjectURL(logoPreview);
    }, [logoPreview]);

    const setField = (key: keyof typeof form, value: string) => setForm((current) => ({...current, [key]: value}));
    // The address the site will have: the one typed, else one made from the name, as the server makes it.
    const resolvedSlug = resolveSiteSlug(form.name, form.siteSlug);
    const siteOrigin = resolvedSlug.ok ? companySiteOrigin(resolvedSlug.slug) : null;

    function locateMe() {
        navigator.geolocation?.getCurrentPosition(
            (position) => setPin({lat: position.coords.latitude, lng: position.coords.longitude}),
            () => toast.error(resolveLanguageKey("locationError")),
        );
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        if (!businessType) {
            toast.error(resolveLanguageKey("typeRequired"));
            return;
        }
        if (!pin) {
            toast.error(resolveLanguageKey("pinRequired"));
            return;
        }
        const payload = new FormData();
        payload.append("data", JSON.stringify({
            businessType,
            name: form.name.trim(),
            phoneNumber: form.phoneNumber.trim(),
            vat: form.vat.trim() || undefined,
            siteSlug: form.siteSlug.trim() || undefined,
            ref,
            address: {
                street: form.street.trim(),
                postalCode: form.postalCode.trim(),
                country: form.country,
                city: form.city,
                latitude: pin.lat,
                longitude: pin.lng,
            },
        }));
        if (logo) payload.append("files", logo);
        setCreateCall((current) => ({form: payload, count: current.count + 1}));
    }

    usePortalTitle(created ? resolveLanguageKey("doneTitle").replace("{name}", created.name) : resolveLanguageKey("title"));

    if (created) {
        return (
            <div className="site-container flex max-w-3xl flex-col gap-6 py-8 sm:py-12">
                <IconCircleCheck className="h-12 w-12 text-emerald-600" aria-hidden />
                <h1 className="font-display text-3xl font-bold tracking-tight">{resolveLanguageKey("doneTitle").replace("{name}", created.name)}</h1>
                <p className="text-muted-foreground">{resolveLanguageKey("doneLead")}</p>
                <div className="flex flex-wrap gap-3">
                    <Button asChild size="lg">
                        <a href={created.siteUrl} target="_blank" rel="noreferrer">
                            {resolveLanguageKey("visitSite")}
                            <IconExternalLink aria-hidden />
                        </a>
                    </Button>
                    {created.panelUrl ? (
                        <Button asChild size="lg" variant="outline">
                            <a href={panelSignInUrl(created.panelUrl, user.username)}>{resolveLanguageKey("openPanel")}</a>
                        </Button>
                    ) : null}
                </div>
                <p className="rounded-2xl bg-muted px-5 py-4 text-sm text-muted-foreground">{resolveLanguageKey("approvalNote").replace("{brand}", brand)}</p>
            </div>
        );
    }

    const submitting = createRequest.loading;
    return (
        <div className="site-container flex flex-col gap-8 py-8 sm:py-12">
            <Link to={businessHref} className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground">
                <IconArrowLeft className="h-4 w-4" aria-hidden />
                {resolveLanguageKey("back")}
            </Link>
            <div className="flex flex-col gap-2">
                <h1 className="font-display text-3xl font-bold tracking-tight">{resolveLanguageKey("title")}</h1>
                <p className="max-w-2xl text-muted-foreground">{resolveLanguageKey("lead")}</p>
            </div>

            <form onSubmit={submit} className="flex max-w-3xl flex-col gap-10">
                <section className="flex flex-col gap-4" aria-labelledby="new-business-type">
                    <h2 id="new-business-type" className="font-semibold">{resolveLanguageKey("sectionType")}</h2>
                    <RadioGroup value={businessType} onValueChange={setBusinessType} aria-labelledby="new-business-type" className="sm:grid-cols-2">
                        {businessTypes.map(({key, Icon, Summary}) => (
                            <Label
                                key={key}
                                htmlFor={`business-type-${key}`}
                                className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 font-normal has-[[data-state=checked]]:border-foreground"
                            >
                                <RadioGroupItem id={`business-type-${key}`} value={key} className="mt-1" />
                                <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                                <Summary />
                            </Label>
                        ))}
                    </RadioGroup>
                </section>

                <section className="flex flex-col gap-4" aria-labelledby="new-business-about">
                    <h2 id="new-business-about" className="font-semibold">{resolveLanguageKey("sectionAbout")}</h2>
                    <Label className="flex-col items-stretch gap-1.5">
                        {resolveLanguageKey("nameLabel")}
                        <Input required maxLength={120} value={form.name} onChange={(event) => setField("name", event.target.value)} />
                    </Label>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Label className="flex-col items-stretch gap-1.5">
                            {resolveLanguageKey("phoneLabel")}
                            <Input required type="tel" maxLength={40} autoComplete="tel" value={form.phoneNumber} onChange={(event) => setField("phoneNumber", event.target.value)} />
                        </Label>
                        <Label className="flex-col items-stretch gap-1.5">
                            {resolveLanguageKey("vatLabel")}
                            <Input maxLength={40} value={form.vat} onChange={(event) => setField("vat", event.target.value)} aria-describedby="new-business-vat-hint" />
                        </Label>
                    </div>
                    <p id="new-business-vat-hint" className="-mt-2 text-xs text-muted-foreground">{resolveLanguageKey("vatHint")}</p>
                    <div className="flex flex-col gap-1.5 text-sm font-medium">
                        {resolveLanguageKey("logoLabel")}
                        <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-border p-4 hover:border-foreground">
                            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
                                {logoPreview ? <img src={logoPreview} alt="" className="h-full w-full object-contain" /> : <IconPhotoPlus className="h-6 w-6" aria-hidden />}
                            </span>
                            <span className="font-normal text-muted-foreground">{logo?.name ?? resolveLanguageKey("logoHint")}</span>
                            <Input bare type="file" accept="image/*" className="sr-only" onChange={(event) => setLogo(event.target.files?.[0] ?? null)} />
                        </label>
                    </div>
                </section>

                <section className="flex flex-col gap-4" aria-labelledby="new-business-where">
                    <h2 id="new-business-where" className="font-semibold">{resolveLanguageKey("sectionWhere")}</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Label className="flex-col items-stretch gap-1.5 sm:col-span-2">
                            {resolveLanguageKey("streetLabel")}
                            <Input required maxLength={200} autoComplete="street-address" value={form.street} onChange={(event) => setField("street", event.target.value)} />
                        </Label>
                        <Label className="flex-col items-stretch gap-1.5">
                            {resolveLanguageKey("countryLabel")}
                            <NativeSelect required value={form.country} onChange={(event) => setForm((current) => ({...current, country: event.target.value, city: ""}))} className="w-full">
                                <option value="">{resolveLanguageKey("selectPlaceholder")}</option>
                                {countries.map((country) => <option key={country._id} value={country._id}>{country.name}</option>)}
                            </NativeSelect>
                        </Label>
                        <Label className="flex-col items-stretch gap-1.5">
                            {resolveLanguageKey("cityLabel")}
                            <NativeSelect required disabled={!form.country} value={form.city} onChange={(event) => setField("city", event.target.value)} className="w-full">
                                <option value="">{resolveLanguageKey("selectPlaceholder")}</option>
                                {cities.map((city) => <option key={city._id} value={city._id}>{city.name}</option>)}
                            </NativeSelect>
                        </Label>
                        <Label className="flex-col items-stretch gap-1.5">
                            {resolveLanguageKey("postalCodeLabel")}
                            <Input required maxLength={20} autoComplete="postal-code" value={form.postalCode} onChange={(event) => setField("postalCode", event.target.value)} />
                        </Label>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                            <span className="font-medium">{resolveLanguageKey("pinLabel")}</span>
                            <Button variant="link" type="button" onClick={locateMe} className="h-auto gap-1.5 p-0">
                                <IconCurrentLocation aria-hidden />
                                {resolveLanguageKey("useMyLocation")}
                            </Button>
                        </div>
                        <div className="h-72 overflow-hidden rounded-2xl">
                            <SinglePinMap
                                latitude={pin?.lat ?? DEFAULT_PIN.lat}
                                longitude={pin?.lng ?? DEFAULT_PIN.lng}
                                onPinChange={(coords) => setPin(coords)}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">{resolveLanguageKey(pin ? "pinSet" : "pinHint")}</p>
                    </div>
                </section>

                <section className="flex flex-col gap-4" aria-labelledby="new-business-site">
                    <h2 id="new-business-site" className="font-semibold">{resolveLanguageKey("sectionSite")}</h2>
                    <Label className="flex-col items-stretch gap-1.5 sm:max-w-sm">
                        {resolveLanguageKey("siteSlugLabel")}
                        <Input maxLength={63} value={form.siteSlug} onChange={(event) => setField("siteSlug", event.target.value)} aria-describedby="new-business-site-hint" />
                    </Label>
                    <p id="new-business-site-hint" className="text-sm text-muted-foreground">
                        {siteOrigin ? resolveLanguageKey("siteSlugPreview").replace("{url}", siteOrigin) : resolveLanguageKey("siteSlugHint")}
                    </p>
                </section>

                <div className="flex flex-col gap-3 border-t border-border pt-6">
                    <p className="text-sm text-muted-foreground">{resolveLanguageKey("freeNote").replace("{brand}", brand)}</p>
                    <div className="flex flex-wrap gap-3">
                        <Button size="lg" type="submit" disabled={submitting}>
                            {resolveLanguageKey(submitting ? "submitting" : "submit")}
                        </Button>
                        <Button asChild variant="outline" size="lg"><Link to={businessHref}>{resolveLanguageKey("cancel")}</Link></Button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default compose(
    withLanguage(LANGUAGE_PATH),
    withDebug(true, true),
)(NewBusinessPage);
