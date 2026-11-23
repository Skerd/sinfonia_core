import {IconChevronDown, IconMenu, IconSearch, IconUser} from "@tabler/icons-react";
import {useEffect, useRef, useState} from "react";
import {compose} from "redux";
import {useDispatch, useSelector} from "react-redux";
import {Link, NavLink, useLocation, useNavigate, useSearchParams} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {signOut} from "@coreModule/helpers/redux/slices/authSlice.ts";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@coreModule/components/ui/input-group.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger} from "@coreModule/components/ui/sheet.tsx";
import {Separator} from "@coreModule/components/ui/separator.tsx";
import {SlidingIndicator} from "@coreModule/components/ui/sliding-indicator.tsx";
import LanguageSwitch from "@coreModule/components/custom/preferences/languageSwitch.tsx";
import ThemeSwitch from "@coreModule/components/custom/preferences/themeSwitch.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import PortalSectionName from "../portalSectionName.tsx";
import {usePortalSite} from "../portalSiteContext.tsx";
import {SectionBaseProvider, sectionHref} from "../sectionBase.tsx";
import {searchPlaceholder} from "../searchPlaceholder.ts";
import type {PortalSection} from "@coreModule/helpers/types/portalContribution.types.ts";

/** A section is current on its own pages, and on the home catalog while one of its kinds is chosen. */
function useIsSectionActive(): (section: PortalSection) => boolean {
    const {pathname, search} = useLocation();
    const kind = new URLSearchParams(search).get("kind");
    return (section) => pathname.startsWith(`/${section.path}`) || Boolean(kind && section.catalogs?.some((catalog) => catalog.kind === kind));
}

/** `sliding`: the row draws the active pill itself (`SlidingIndicator`), so the link only changes colour. */
function navLinkClass({isActive, sliding = false}: {isActive: boolean; sliding?: boolean}): string {
    return cn(
        "rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
        sliding && "relative",
        isActive && "text-foreground",
        isActive && !sliding && "bg-muted",
    );
}

/** The site's logo, or its name when it has none. */
function Brand() {
    const {site} = usePortalSite();
    if (!site) return null;
    return site.company.logo
        ? <img src={site.company.logo} alt={site.company.name} className="h-10 w-auto max-w-48 rounded-sm object-contain" />
        : <span className="truncate font-display text-lg font-bold tracking-tight">{site.company.name}</span>;
}

/** Typing searches by itself after this pause, as the panel's list search does. */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * One query across every section; the home page narrows it down. It searches as you type, after a short pause. The box
 * shows the home page's query, and emptying it drops that query at once, so an empty box never sits above old results.
 */
function NavigationSearch({resolveLanguageKey}: Pick<WithLanguageType, "resolveLanguageKey">) {
    const navigate = useNavigate();
    const {pathname} = useLocation();
    const [params, setParams] = useSearchParams();
    const {sections} = usePortalSite();
    const onHome = pathname === "/";
    const shownQuery = onHome ? params.get("q") ?? "" : "";
    const [query, setQuery] = useState(shownQuery);
    /* The query this box last put in the URL: its echo must not undo keys typed since (as the panel's ListSearchBar). */
    const sent = useRef(shownQuery);
    const timer = useRef(0);
    const placeholder = searchPlaceholder(resolveLanguageKey, "searchPlaceholder", sections);

    useEffect(() => {
        if (shownQuery === sent.current) return;
        // Changed elsewhere (the home page's own box, back/forward, a link): that wins over a pending keystroke.
        window.clearTimeout(timer.current);
        sent.current = shownQuery;
        setQuery(shownQuery);
    }, [shownQuery]);
    useEffect(() => () => window.clearTimeout(timer.current), []);

    const send = (text: string) => {
        window.clearTimeout(timer.current);
        const trimmed = text.trim();
        if (trimmed === sent.current) return;
        sent.current = trimmed;
        if (!onHome) {
            if (trimmed) navigate(`/?${new URLSearchParams({q: trimmed})}`);
            return;
        }
        // On the home page only the query changes; the kind and city chosen there stay. Refining a query replaces the
        // history entry, so Back returns to the previous search rather than the previous letter.
        setParams((current) => {
            const next = new URLSearchParams(current);
            if (trimmed) next.set("q", trimmed);
            else next.delete("q");
            next.delete("page");
            return next;
        }, {replace: Boolean(shownQuery && trimmed)});
    };

    return (
        <form
            role="search"
            className="w-full max-w-xl"
            onSubmit={(event) => {
                event.preventDefault();
                send(query);
            }}
        >
            <InputGroup className="h-11 rounded-full bg-muted/40">
                <InputGroupAddon><IconSearch aria-hidden /></InputGroupAddon>
                <InputGroupInput
                    value={query}
                    onChange={(event) => {
                        const next = event.target.value;
                        setQuery(next);
                        window.clearTimeout(timer.current);
                        if (!next.trim()) send("");
                        else timer.current = window.setTimeout(() => send(next), SEARCH_DEBOUNCE_MS);
                    }}
                    placeholder={placeholder}
                    aria-label={placeholder}
                />
            </InputGroup>
        </form>
    );
}

/** More sections than this go in the Explore menu (the apex); a company site keeps its few as links. */
const INLINE_SECTIONS_MAX = 2;

/**
 * The apex's sections in one menu, so the header keeps to the logo, the search and the account (the user, 2026-11-23:
 * "it's full of menus, I need something sleeker"). Inside a section the button names it.
 */
function ExploreMenu({sections, activeLink, resolveLanguageKey}: {
    sections: readonly PortalSection[];
    activeLink: string | undefined;
    resolveLanguageKey: WithLanguageType["resolveLanguageKey"];
}) {
    const active = sections.find((section) => section.section === activeLink);
    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden gap-1.5 rounded-full px-4 font-medium lg:inline-flex">
                    {active ? <PortalSectionName section={active.section} /> : resolveLanguageKey(activeLink === "blog" ? "blog" : "explore")}
                    <IconChevronDown className="size-4 text-muted-foreground" aria-hidden />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="grid w-96 grid-cols-2 gap-1 p-2">
                {sections.map((section) => (
                    <DropdownMenuItem
                        key={section.section}
                        asChild
                        className={cn("rounded-lg px-3 py-2.5 font-medium", section.section === activeLink && "bg-muted")}
                    >
                        <Link to={sectionHref(section)}><PortalSectionName section={section.section} /></Link>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="col-span-2" />
                <DropdownMenuItem asChild className={cn("col-span-2 rounded-lg px-3 py-2 text-muted-foreground", activeLink === "blog" && "bg-muted")}>
                    <Link to="/blog">{resolveLanguageKey("blog")}</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/** Header: the site's brand, its sections, search, preferences and the visitor's account. */
function PortalNavigation({resolveLanguageKey}: WithLanguageType) {
    const dispatch = useDispatch();
    const token = useSelector((state: RootState) => state.authentication.token);
    const {pathname} = useLocation();
    const {site, sections} = usePortalSite();
    const isSectionActive = useIsSectionActive();
    const blogActive = pathname === "/blog" || pathname.startsWith("/blog/");
    // Self-serve business sign-up lives on the apex only (D178).
    const offersBusinessSignUp = site?.scope === "platform";
    const businessActive = offersBusinessSignUp && (pathname === "/business" || pathname.startsWith("/business/"));
    const activeLink = sections.find(isSectionActive)?.section ?? (blogActive ? "blog" : businessActive ? "business" : undefined);
    const [menuOpen, setMenuOpen] = useState(false);
    const closeMenu = () => setMenuOpen(false);

    return (
        <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <div className="site-container flex h-20 items-center gap-3 lg:gap-6">
                <Link to="/" className="flex min-w-0 shrink-0 items-center" aria-label={resolveLanguageKey("home")}>
                    <Brand />
                </Link>
                {sections.length > INLINE_SECTIONS_MAX ? (
                    <ExploreMenu sections={sections} activeLink={activeLink} resolveLanguageKey={resolveLanguageKey} />
                ) : (
                    <nav className="relative hidden items-center gap-1 lg:flex" aria-label={resolveLanguageKey("navLabel")}>
                        {/* The current section's pill slides from link to link. */}
                        <SlidingIndicator activeKey={activeLink} className="rounded-full bg-muted" />
                        {sections.map((section) => (
                            <Link
                                key={section.section}
                                to={sectionHref(section)}
                                data-indicator-active={activeLink === section.section ? "" : undefined}
                                className={navLinkClass({isActive: activeLink === section.section, sliding: true})}
                            >
                                <PortalSectionName section={section.section} />
                            </Link>
                        ))}
                        <Link to="/blog" data-indicator-active={activeLink === "blog" ? "" : undefined} className={navLinkClass({isActive: activeLink === "blog", sliding: true})}>
                            {resolveLanguageKey("blog")}
                        </Link>
                    </nav>
                )}
                <div className="hidden min-w-0 flex-1 justify-center md:flex">
                    <NavigationSearch resolveLanguageKey={resolveLanguageKey} />
                </div>
                <div className="ml-auto flex items-center gap-1 md:ml-0">
                    {offersBusinessSignUp ? (
                        <Link to="/business" className={cn(navLinkClass({isActive: businessActive}), "hidden whitespace-nowrap lg:inline-flex")}>
                            {resolveLanguageKey("forBusinesses")}
                        </Link>
                    ) : null}
                    {sections.map(({section, path, NavAction}) => NavAction ? (
                        <SectionBaseProvider key={section} base={`/${path}`}><NavAction /></SectionBaseProvider>
                    ) : null)}
                    {/* The theme switch lives in the footer: the header keeps what people use on every visit. */}
                    <div className="hidden items-center sm:flex">
                        <LanguageSwitch />
                    </div>
                    {token ? (
                        <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label={resolveLanguageKey("accountMenu")}>
                                    <IconUser />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-44">
                                <DropdownMenuItem asChild>
                                    <Link to="/account">{resolveLanguageKey("account")}</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/account/saved">{resolveLanguageKey("saved")}</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => dispatch(signOut())}>
                                    {resolveLanguageKey("signOut")}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button asChild size="lg" className="hidden px-4 sm:inline-flex">
                            <Link to="/login">{resolveLanguageKey("signIn")}</Link>
                        </Button>
                    )}
                    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="lg:hidden" aria-label={resolveLanguageKey("openMenu")}>
                                <IconMenu />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-80 gap-0">
                            <SheetHeader>
                                <SheetTitle><Brand /></SheetTitle>
                                <SheetDescription className="sr-only">{resolveLanguageKey("navLabel")}</SheetDescription>
                            </SheetHeader>
                            <nav className="flex flex-col gap-1 px-4" aria-label={resolveLanguageKey("navLabel")}>
                                {sections.map((section) => (
                                    <Link key={section.section} to={sectionHref(section)} className={navLinkClass({isActive: isSectionActive(section)})} onClick={closeMenu}>
                                        <PortalSectionName section={section.section} />
                                    </Link>
                                ))}
                                <Link to="/blog" className={navLinkClass({isActive: blogActive})} onClick={closeMenu}>{resolveLanguageKey("blog")}</Link>
                                {offersBusinessSignUp ? (
                                    <Link to="/business" className={navLinkClass({isActive: businessActive})} onClick={closeMenu}>{resolveLanguageKey("forBusinesses")}</Link>
                                ) : null}
                            </nav>
                            <Separator className="my-4" />
                            <div className="flex flex-col gap-1 px-4">
                                {token ? (
                                    <>
                                        <NavLink to="/account" end className={navLinkClass} onClick={closeMenu}>{resolveLanguageKey("account")}</NavLink>
                                        <NavLink to="/account/saved" className={navLinkClass} onClick={closeMenu}>{resolveLanguageKey("saved")}</NavLink>
                                        <Button variant="ghost" className="justify-start rounded-full px-3 text-muted-foreground" onClick={() => { closeMenu(); dispatch(signOut()); }}>
                                            {resolveLanguageKey("signOut")}
                                        </Button>
                                    </>
                                ) : (
                                    <Button asChild size="lg">
                                        <Link to="/login" onClick={closeMenu}>{resolveLanguageKey("signIn")}</Link>
                                    </Button>
                                )}
                            </div>
                            <div className="mt-auto flex items-center gap-1 p-4">
                                <LanguageSwitch showTitles />
                                <ThemeSwitch showTitles />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/shared/navigation/index.tsx"))(PortalNavigation);
