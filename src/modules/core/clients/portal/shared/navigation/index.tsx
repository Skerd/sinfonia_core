import {IconMenu, IconSearch, IconUser} from "@tabler/icons-react";
import {useState} from "react";
import {compose} from "redux";
import {useDispatch, useSelector} from "react-redux";
import {Link, NavLink, useLocation, useNavigate} from "react-router-dom";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {signOut} from "@coreModule/helpers/redux/slices/authSlice.ts";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@coreModule/components/ui/input-group.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger} from "@coreModule/components/ui/sheet.tsx";
import {Separator} from "@coreModule/components/ui/separator.tsx";
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

function navLinkClass({isActive}: {isActive: boolean}): string {
    return cn(
        "rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
        isActive && "bg-muted text-foreground",
    );
}

/** The site's logo, or its name when it has none. */
function Brand() {
    const {site} = usePortalSite();
    if (!site) return null;
    return site.company.logo
        ? <img src={site.company.logo} alt={site.company.name} className="h-8 w-auto max-w-40 object-contain" />
        : <span className="truncate font-display text-lg font-bold tracking-tight">{site.company.name}</span>;
}

/** One query across every section; the home page narrows it down. */
function NavigationSearch({resolveLanguageKey}: Pick<WithLanguageType, "resolveLanguageKey">) {
    const navigate = useNavigate();
    const {sections} = usePortalSite();
    const [query, setQuery] = useState("");
    const placeholder = searchPlaceholder(resolveLanguageKey, "searchPlaceholder", sections);

    return (
        <form
            role="search"
            className="w-full max-w-xs"
            onSubmit={(event) => {
                event.preventDefault();
                if (query.trim()) navigate(`/?${new URLSearchParams({q: query.trim()})}`);
            }}
        >
            <InputGroup>
                <InputGroupAddon><IconSearch aria-hidden /></InputGroupAddon>
                <InputGroupInput
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={placeholder}
                    aria-label={placeholder}
                />
            </InputGroup>
        </form>
    );
}

/** Header: the site's brand, its sections, search, preferences and the visitor's account. */
function PortalNavigation({resolveLanguageKey}: WithLanguageType) {
    const dispatch = useDispatch();
    const token = useSelector((state: RootState) => state.authentication.token);
    const {pathname} = useLocation();
    const {sections} = usePortalSite();
    const isSectionActive = useIsSectionActive();
    const blogActive = pathname === "/blog" || pathname.startsWith("/blog/");
    const [menuOpen, setMenuOpen] = useState(false);
    const closeMenu = () => setMenuOpen(false);

    return (
        <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <div className="site-container flex h-16 items-center gap-4">
                <Link to="/" className="flex min-w-0 shrink-0 items-center" aria-label={resolveLanguageKey("home")}>
                    <Brand />
                </Link>
                <nav className="hidden items-center gap-1 lg:flex" aria-label={resolveLanguageKey("navLabel")}>
                    {sections.map((section) => (
                        <Link key={section.section} to={sectionHref(section)} className={navLinkClass({isActive: isSectionActive(section)})}>
                            <PortalSectionName section={section.section} />
                        </Link>
                    ))}
                    <Link to="/blog" className={navLinkClass({isActive: blogActive})}>{resolveLanguageKey("blog")}</Link>
                </nav>
                <div className="ml-auto hidden flex-1 justify-end md:flex">
                    <NavigationSearch resolveLanguageKey={resolveLanguageKey} />
                </div>
                <div className="ml-auto flex items-center gap-1 md:ml-0">
                    {sections.map(({section, path, NavAction}) => NavAction ? (
                        <SectionBaseProvider key={section} base={`/${path}`}><NavAction /></SectionBaseProvider>
                    ) : null)}
                    <div className="hidden items-center sm:flex">
                        <LanguageSwitch />
                        <ThemeSwitch />
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
                            </nav>
                            <Separator className="my-4" />
                            <div className="flex flex-col gap-1 px-4">
                                {token ? (
                                    <>
                                        <NavLink to="/account" className={navLinkClass} onClick={closeMenu}>{resolveLanguageKey("account")}</NavLink>
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
