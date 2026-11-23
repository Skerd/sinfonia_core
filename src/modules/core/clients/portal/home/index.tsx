import {IconWorld, IconMail, IconMapPin, IconPhone, IconSearch} from "@tabler/icons-react";
import {useEffect, useRef, useState} from "react";
import {compose} from "redux";
import {useSearchParams} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@coreModule/components/ui/input-group.tsx";
import type {PortalSiteCompany} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";
import {usePortalSite} from "../shared/portalSiteContext.tsx";
import {searchPlaceholder} from "../shared/searchPlaceholder.ts";
import {SectionBaseProvider} from "../shared/sectionBase.tsx";
import {BlogSection} from "../blog/index.tsx";
import Catalog from "./catalog.tsx";

type ResolveLanguageKey = WithLanguageType["resolveLanguageKey"];

/** Compare city names without case or accents, so "durres" finds "Durrës". */
function foldCity(value: string) {
    return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** Typing in "what" searches by itself after this pause, as the panel's list search does. */
const SEARCH_DEBOUNCE_MS = 300;

/** "What" and "where", across every kind; the catalog below narrows it down. */
function CatalogSearch({cities, resolveLanguageKey}: {cities: readonly string[]; resolveLanguageKey: ResolveLanguageKey}) {
    const [params, setParams] = useSearchParams();
    const named = params.get("city") ?? "";
    const query = params.get("q") ?? "";

    return (
        <CatalogSearchForm
            key={named}
            cities={cities}
            query={query}
            city={named}
            resolveLanguageKey={resolveLanguageKey}
            onQuery={(q) => {
                // Refining a query replaces the history entry, so Back returns to the previous search, not the previous letter.
                setParams((current) => {
                    const next = new URLSearchParams(current);
                    if (q) next.set("q", q); else next.delete("q");
                    next.delete("page");
                    return next;
                }, {replace: Boolean(query && q)});
            }}
            onSearch={(q, city) => {
                setParams((current) => {
                    const next = new URLSearchParams(current);
                    if (q) next.set("q", q); else next.delete("q");
                    if (city) next.set("city", city); else next.delete("city");
                    next.delete("page");
                    return next;
                });
            }}
        />
    );
}

function CatalogSearchForm({
    cities,
    query,
    city: initialCity,
    resolveLanguageKey,
    onQuery,
    onSearch,
}: {
    cities: readonly string[];
    query: string;
    city: string;
    resolveLanguageKey: ResolveLanguageKey;
    /**
     * The "what" text alone, as it is typed (after a pause) or emptied (at once, so no results stand under an empty box).
     * The city waits for the search button.
     */
    onQuery: (query: string) => void;
    onSearch: (query: string, city: string) => void;
}) {
    const {sections} = usePortalSite();
    const [text, setText] = useState(query);
    /* The query this form last put in the URL: its echo must not undo keys typed since (as the panel's ListSearchBar). */
    const sent = useRef(query);
    const timer = useRef(0);
    useEffect(() => {
        if (query === sent.current) return;
        // Changed elsewhere (the header's box, back/forward, a link): that wins over a pending keystroke.
        window.clearTimeout(timer.current);
        sent.current = query;
        setText(query);
    }, [query]);
    useEffect(() => () => window.clearTimeout(timer.current), []);

    function sendQuery(typed: string) {
        window.clearTimeout(timer.current);
        const trimmed = typed.trim();
        if (trimmed === sent.current) return;
        sent.current = trimmed;
        onQuery(trimmed);
    }

    function search(q: string, city: string) {
        window.clearTimeout(timer.current);
        sent.current = q;
        onSearch(q, city);
    }
    const options = initialCity && !cities.includes(initialCity) ? [initialCity, ...cities] : cities;
    const [draft, setDraft] = useState(initialCity);
    const [cityQuery, setCityQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const [moved, setMoved] = useState(false);
    const needle = foldCity(cityQuery.trim());
    const shown = needle ? options.filter((name) => foldCity(name).includes(needle)) : options;
    const choices = needle ? shown : ["", ...options];

    function resolveCity(typed: string) {
        const trimmed = typed.trim();
        if (!trimmed) return "";
        return options.find((name) => foldCity(name) === foldCity(trimmed)) ?? trimmed;
    }

    function fill(name: string) {
        setDraft(name);
        setCityQuery("");
        setOpen(false);
        setMoved(false);
    }

    return (
        <form
            role="search"
            className="grid gap-2 rounded-3xl border bg-card p-2 shadow-sm sm:grid-cols-[1fr_1fr_auto]"
            onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                const city = resolveCity(draft);
                setDraft(city);
                setOpen(false);
                search(String(data.get("q") ?? "").trim(), city);
            }}
        >
            <InputGroup className="h-12 border-0 shadow-none dark:bg-transparent">
                <InputGroupAddon><IconSearch aria-hidden /></InputGroupAddon>
                <InputGroupInput
                    name="q"
                    value={text}
                    onChange={(event) => {
                        const next = event.target.value;
                        setText(next);
                        window.clearTimeout(timer.current);
                        if (!next.trim()) sendQuery("");
                        else timer.current = window.setTimeout(() => sendQuery(next), SEARCH_DEBOUNCE_MS);
                    }}
                    placeholder={searchPlaceholder(resolveLanguageKey, "whatPlaceholder", sections)}
                    aria-label={resolveLanguageKey("what")}
                />
            </InputGroup>
            {/* On a phone the fields stack, so the line sits above the city. Beside each other, the city field carries it. */}
            <div className="relative z-20 border-t border-foreground/20 sm:contents">
            <InputGroup
                className="h-12 border-0 shadow-none sm:rounded-none sm:border-l sm:border-foreground/20 dark:bg-transparent"
                onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
                }}
            >
                <InputGroupAddon><IconMapPin aria-hidden /></InputGroupAddon>
                <InputGroupInput
                    role="combobox"
                    aria-label={resolveLanguageKey("where")}
                    aria-expanded={open}
                    aria-autocomplete="list"
                    aria-controls="portal-city-list"
                    autoComplete="off"
                    placeholder={resolveLanguageKey("wherePlaceholder")}
                    value={draft}
                    onChange={(event) => {
                        setDraft(event.target.value);
                        setCityQuery(event.target.value);
                        setActive(0);
                        setMoved(false);
                        setOpen(true);
                    }}
                    onFocus={(event) => {
                        setCityQuery("");
                        setOpen(true);
                        event.currentTarget.select();
                    }}
                    onKeyDown={(event) => {
                        const items = choices;
                        if (event.key === "ArrowDown") {
                            event.preventDefault();
                            setOpen(true);
                            setMoved(true);
                            setActive((index) => Math.min(index + 1, items.length - 1));
                        } else if (event.key === "ArrowUp") {
                            event.preventDefault();
                            setMoved(true);
                            setActive((index) => Math.max(index - 1, 0));
                        } else if (event.key === "Escape") {
                            setOpen(false);
                        } else if (event.key === "Enter" && open && (moved || needle.length > 0) && items.length > 0) {
                            event.preventDefault();
                            const form = event.currentTarget.form;
                            const name = items[Math.min(active, items.length - 1)] ?? "";
                            fill(name);
                            if (form) {
                                const data = new FormData(form);
                                search(String(data.get("q") ?? "").trim(), name);
                            }
                        }
                    }}
                />
                {open ? (
                    <ul id="portal-city-list" role="listbox" className="absolute top-[calc(100%+0.25rem)] right-0 left-0 z-50 max-h-72 overflow-y-auto rounded-xl bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
                        {choices.length === 0 ? (
                            <li className="px-2 py-1.5 text-sm text-muted-foreground">{resolveLanguageKey("noCities")}</li>
                        ) : choices.map((name, index) => (
                            <li key={name || "anywhere"} role="presentation">
                                <Button variant="bare"
                                    type="button"
                                    role="option"
                                    aria-selected={index === active}
                                    className={cn(
                                        "flex w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-sm",
                                        index === active ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground",
                                    )}
                                    onMouseEnter={() => setActive(index)}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => fill(name)}
                                >
                                    {name || resolveLanguageKey("anywhere")}
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </InputGroup>
            </div>
            <Button type="submit" size="lg" className="h-12 px-6">
                <IconSearch aria-hidden />
                {resolveLanguageKey("search")}
            </Button>
        </form>
    );
}

/** On a company's own site: who it is, where it works and how to reach it. */
function CompanyIntro({company, resolveLanguageKey}: {company: PortalSiteCompany; resolveLanguageKey: ResolveLanguageKey}) {
    return (
        <section className="flex flex-col gap-6 rounded-3xl bg-muted px-6 py-10 sm:flex-row sm:items-center sm:px-10 sm:py-14">
            <Avatar className="size-20 rounded-2xl bg-background sm:size-24">
                {company.logo ? <AvatarImage src={company.logo} alt="" className="object-contain p-2" /> : null}
                <AvatarFallback className="rounded-2xl font-display text-2xl font-bold">{company.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">{company.name}</h1>
                {company.description ? <p className="line-clamp-3 max-w-2xl leading-relaxed text-muted-foreground">{company.description}</p> : null}
                {company.cities.length ? (
                    <div className="flex flex-wrap gap-1.5">
                        {company.cities.map((city) => (
                            <Badge key={city} variant="outline" className="bg-background"><IconMapPin aria-hidden />{city}</Badge>
                        ))}
                    </div>
                ) : null}
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-col">
                {company.phoneNumber ? (
                    <Button asChild size="lg"><a href={`tel:${company.phoneNumber.replace(/[^\d+]/g, "")}`}><IconPhone aria-hidden />{resolveLanguageKey("call")}</a></Button>
                ) : null}
                {company.email ? (
                    <Button asChild size="lg" variant="outline" className="bg-background"><a href={`mailto:${company.email}`}><IconMail aria-hidden />{resolveLanguageKey("email")}</a></Button>
                ) : null}
                {company.website ? (
                    <Button asChild size="lg" variant="outline" className="bg-background">
                        <a href={company.website} target="_blank" rel="noopener noreferrer"><IconWorld aria-hidden />{resolveLanguageKey("website")}</a>
                    </Button>
                ) : null}
            </div>
        </section>
    );
}

/** The home page: the site's intro, one search across everything, the sections' own blocks, the catalog, then the journal. */
function PortalHomePage({resolveLanguageKey}: WithLanguageType) {
    const {site, sections} = usePortalSite();
    const [params] = useSearchParams();
    if (!site) return null;
    // The sections' showcases sit above an unfiltered catalog only.
    const browsing = !params.get("kind") && !params.get("q") && !params.get("city");

    return (
        <div className="site-container flex flex-col gap-12 py-8 sm:gap-16 sm:py-12">
            <div className="flex flex-col gap-6">
                {site.scope === "company" ? (
                    <CompanyIntro company={site.company} resolveLanguageKey={resolveLanguageKey} />
                ) : (
                    <section className="flex flex-col gap-4 pt-6 sm:pt-12">
                        <h1 className="max-w-3xl font-display text-4xl leading-[1.05] font-bold tracking-tight sm:text-6xl">{resolveLanguageKey("title")}</h1>
                        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">{resolveLanguageKey("subtitle")}</p>
                    </section>
                )}
                <CatalogSearch cities={site.cities} resolveLanguageKey={resolveLanguageKey} />
            </div>
            {browsing ? sections.map(({section, path, Home}) => Home ? (
                <SectionBaseProvider key={section} base={`/${path}`}><Home /></SectionBaseProvider>
            ) : null) : null}
            <Catalog />
            {browsing ? <BlogSection /> : null}
        </div>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/home/index.tsx"))(PortalHomePage);
