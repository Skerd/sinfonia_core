import {compose} from "redux";
import {useEffect, useMemo, useRef, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {useSelector} from "react-redux";
import withLanguage, {type WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {getPanelNavGroups} from "@coreModule/helpers/panel/panelNavGroups.ts";
import {flattenPanelNavLinks, type FlatPanelNavLink} from "@coreModule/helpers/panel/flattenPanelNavLinks.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import ThemeSwitch from "@coreModule/components/custom/themeSwitch.tsx";
import LanguageSwitch from "@coreModule/components/custom/languageSwitch.tsx";
import NotificationBell from "@coreModule/components/custom/notificationBell";
import {LayoutGrid, Search} from "lucide-react";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Separator} from "@coreModule/components/ui/separator.tsx";

const TILE_COLORS = [
    {
        icon: "from-violet-500/25 to-purple-600/25 text-violet-600 dark:text-violet-400 border-violet-200/70 dark:border-violet-800/40 shadow-violet-500/15",
        chip: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/50 dark:hover:bg-violet-950/60",
        glow: "oklch(0.60 0.28 292 / 0.18)",
    },
    {
        icon: "from-blue-500/25 to-cyan-500/25 text-blue-600 dark:text-blue-400 border-blue-200/70 dark:border-blue-800/40 shadow-blue-500/15",
        chip: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50 dark:hover:bg-blue-950/60",
        glow: "oklch(0.60 0.22 228 / 0.18)",
    },
    {
        icon: "from-emerald-500/25 to-teal-600/25 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/40 shadow-emerald-500/15",
        chip: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50 dark:hover:bg-emerald-950/60",
        glow: "oklch(0.60 0.20 160 / 0.18)",
    },
    {
        icon: "from-amber-400/25 to-orange-500/25 text-amber-600 dark:text-amber-400 border-amber-200/70 dark:border-amber-800/40 shadow-amber-500/15",
        chip: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50 dark:hover:bg-amber-950/60",
        glow: "oklch(0.72 0.20 70 / 0.18)",
    },
    {
        icon: "from-rose-500/25 to-pink-600/25 text-rose-600 dark:text-rose-400 border-rose-200/70 dark:border-rose-800/40 shadow-rose-500/15",
        chip: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50 dark:hover:bg-rose-950/60",
        glow: "oklch(0.62 0.25 10 / 0.18)",
    },
    {
        icon: "from-cyan-500/25 to-sky-600/25 text-cyan-600 dark:text-cyan-400 border-cyan-200/70 dark:border-cyan-800/40 shadow-cyan-500/15",
        chip: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/50 dark:hover:bg-cyan-950/60",
        glow: "oklch(0.65 0.18 200 / 0.18)",
    },
    {
        icon: "from-orange-400/25 to-red-500/25 text-orange-600 dark:text-orange-400 border-orange-200/70 dark:border-orange-800/40 shadow-orange-500/15",
        chip: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/50 dark:hover:bg-orange-950/60",
        glow: "oklch(0.68 0.22 42 / 0.18)",
    },
    {
        icon: "from-indigo-500/25 to-blue-600/25 text-indigo-600 dark:text-indigo-400 border-indigo-200/70 dark:border-indigo-800/40 shadow-indigo-500/15",
        chip: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50 dark:hover:bg-indigo-950/60",
        glow: "oklch(0.55 0.24 262 / 0.18)",
    },
] as const;

type TileColor = (typeof TILE_COLORS)[number];

const RECENT_KEY = "panel_home_recent_v1";
const MAX_RECENT = 8;

function loadRecentUrls(): string[] {
    try {
        return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    } catch {
        return [];
    }
}

function useRecentLinks(allLinks: FlatPanelNavLink[]) {
    const [recentUrls, setRecentUrls] = useState<string[]>(loadRecentUrls);

    function trackVisit(url: string) {
        setRecentUrls((prev) => {
            const next = [url, ...prev.filter((u) => u !== url)].slice(0, MAX_RECENT);
            localStorage.setItem(RECENT_KEY, JSON.stringify(next));
            return next;
        });
    }

    const recentLinks = recentUrls
        .map((url) => allLinks.find((l) => l.url === url))
        .filter((l): l is FlatPanelNavLink => l !== undefined);

    return {recentLinks, trackVisit};
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupLinksBySection(links: FlatPanelNavLink[]): Map<string, FlatPanelNavLink[]> {
    const map = new Map<string, FlatPanelNavLink[]>();
    for (const link of links) {
        const list = map.get(link.groupTitle) ?? [];
        list.push(link);
        map.set(link.groupTitle, list);
    }
    return map;
}

function buildGreeting(name: string, resolveLanguageKey: ResolveLanguageKey): string {
    const hour = new Date().getHours();
    const key = hour < 12 ? "home.greetingMorning" : hour < 18 ? "home.greetingAfternoon" : "home.greetingEvening";
    const salutation = resolveLanguageKey(key);
    return name ? `${salutation}, ${name}` : salutation;
}

// ─── App tile ─────────────────────────────────────────────────────────────────

function AppTile({
    link,
    color,
    staggerIndex,
    launchingUrl,
    onLaunch,
}: {
    link: FlatPanelNavLink;
    color: TileColor;
    staggerIndex: number;
    launchingUrl: string | null;
    onLaunch: (url: string) => void;
}) {
    const Icon = link.icon ?? LayoutGrid;
    const isLaunching = launchingUrl !== null;
    const isThisTile = launchingUrl === link.url;
    const isOtherTile = isLaunching && !isThisTile;

    function handleClick(e: React.MouseEvent) {
        // Let modifier clicks (open in new tab, etc.) pass through unmodified
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (isLaunching) return;
        e.preventDefault();
        onLaunch(link.url);
    }

    function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
    }

    return (
        // Static wrapper owns the stagger animation — its classes never change,
        // so the entrance animation never replays when launchingUrl state updates.
        <div
            style={{
                animationDelay: `${Math.min(staggerIndex * 20, 280)}ms`,
                animationFillMode: "both",
            }}
            className="animate-in fade-in slide-in-from-bottom-3"
        >
            <Link
                to={link.url}
                onClick={handleClick}
                onMouseMove={!isLaunching ? handleMouseMove : undefined}
                className={cn(
                    "group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl p-4 text-center",
                    "bg-white dark:bg-card",
                    "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04)]",
                    "dark:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_4px_12px_rgba(0,0,0,0.25)]",
                    "border border-transparent",
                    "transition-[transform,opacity] duration-220 ease-out",
                    !isLaunching && "hover:-translate-y-1 hover:border-border/60",
                    isThisTile && "scale-[1.12] opacity-0",
                    isOtherTile && "scale-[0.95] opacity-25",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
            >
                {/* Per-tile spotlight glow — follows cursor within the card */}
                <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                        background: `radial-gradient(0px circle at var(--mx, 50%) var(--my, 50%), ${color.glow}, transparent 80%)`,
                    }}
                />

                <span
                    className={cn(
                        "flex size-14 shrink-0 items-center justify-center rounded-2xl",
                        "border bg-linear-to-br shadow-sm",
                        "transition-transform duration-200 ease-out",
                        !isLaunching && "group-hover:scale-110",
                        color.icon,
                    )}
                >
                    <Icon className="size-7" strokeWidth={1.5} aria-hidden />
                </span>

                <span className="flex min-h-10 flex-col items-center justify-center gap-1">
                    <span className="text-sm font-medium leading-tight text-foreground transition-colors group-hover:text-primary">
                        {link.title}
                    </span>
                    {link.badge != null && (
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                            {link.badge}
                        </Badge>
                    )}
                </span>
            </Link>
        </div>
    );
}

// ─── Recent chip ──────────────────────────────────────────────────────────────

function RecentChip({
    link,
    color,
    launchingUrl,
    onLaunch,
}: {
    link: FlatPanelNavLink;
    color: TileColor;
    launchingUrl: string | null;
    onLaunch: (url: string) => void;
}) {
    const Icon = link.icon ?? LayoutGrid;
    const isLaunching = launchingUrl !== null;
    const isThisChip = launchingUrl === link.url;
    const isOtherChip = isLaunching && !isThisChip;

    function handleClick(e: React.MouseEvent) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (isLaunching) return;
        e.preventDefault();
        onLaunch(link.url);
    }

    return (
        <Link
            to={link.url}
            onClick={handleClick}
            className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5",
                "text-xs font-medium",
                "transition-all duration-220 ease-out",
                !isLaunching && "hover:-translate-y-px hover:shadow-sm",
                isThisChip && "scale-110 opacity-0",
                isOtherChip && "opacity-25 scale-95",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                color.chip,
            )}
        >
            <Icon className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
            {link.title}
        </Link>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function PanelHomePage({resolveLanguageKey}: WithLanguageType) {

    const {menu} = useParams();
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [launchingUrl, setLaunchingUrl] = useState<string | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const user = useSelector((state: RootState) => state.authentication.user);
    const channelsUnread = useSelector((state: RootState) => state.chat.channelsUnread);
    const chatUnreadTotal = Object.values(channelsUnread ?? {}).reduce((a, b) => a + b, 0);

    const allLinks = useMemo(() => {
        const groups = getPanelNavGroups(resolveLanguageKey, {chatUnreadTotal});
        return flattenPanelNavLinks(groups);
    }, [resolveLanguageKey, chatUnreadTotal]);

    const {recentLinks, trackVisit} = useRecentLinks(allLinks);

    const sections = useMemo(() => {
        const q = query.trim().toLowerCase();
        const filtered = q
            ? allLinks.filter(
                  (l) =>
                      l.title.toLowerCase().includes(q) ||
                      l.groupTitle.toLowerCase().includes(q),
              )
            : allLinks;
        return groupLinksBySection(filtered);
    }, [allLinks, query]);

    const isSearching = query.trim().length > 0;
    const hasResults = sections.size > 0;
    const greeting = buildGreeting(user?.name ?? "", resolveLanguageKey);

    // Navigate after the launch animation finishes
    useEffect(() => {
        if (!launchingUrl) return;
        navigate(launchingUrl);
        // const timer = setTimeout(() => navigate(launchingUrl), LAUNCH_DELAY_MS);
        // return () => clearTimeout(timer);
    }, [launchingUrl]);

    function handleLaunch(url: string) {
        trackVisit(url);
        setLaunchingUrl(url);
    }

    useEffect(() => {
        if( !!menu ){
            setLaunchingUrl(null);
        }
    }, [menu]);

    let staggerIndex = 0;

    if( !!menu ){
        return <></>
    }

    return (
        <div className="absolute top-0 left-0 flex h-full flex-col overflow-y-auto bg-background flex-full max-h-dvh min-h-dvh min-w-dvw z-50">

            <div className="pointer-events-none absolute inset-x-0 top-0 h-[200px] overflow-hidden" aria-hidden>
                <div
                    className="absolute left-1/2 top-0 h-40 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-[0.06] dark:opacity-[0.11]"
                    style={{background: "radial-gradient(ellipse, oklch(0.62 0.22 264) 0%, transparent 100%)"}}
                />
            </div>

            <header className="relative z-50 flex shrink-0 items-center border-b bg-background/80 px-2 py-1 backdrop-blur supports-backdrop-filter:bg-background/60" style={{border: "0px solid red"}}>
                <div className="ms-auto flex items-center gap-2">
                    <NotificationBell />
                    <Separator orientation="vertical" className="my-1 h-6 shrink-0" />
                    <ThemeSwitch />
                    <LanguageSwitch />
                </div>
            </header>

            <div className="flex-full gap-4">

                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{greeting}</h1>
                    <p className="mt-2 text-sm text-muted-foreground md:text-base">{resolveLanguageKey("home.subtitle")}</p>
                </div>

                <div className="relative mx-auto w-full max-w-5xl px-4">
                    <Search className="pointer-events-none absolute start-8 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        ref={searchRef}
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={resolveLanguageKey("home.searchPlaceholder")}
                        className={cn(
                            "h-12 rounded-2xl pe-16 ps-11 text-sm",
                            "border-border/60 bg-white dark:bg-card",
                            "shadow-[0_2px_8px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]",
                            "dark:shadow-[0_2px_8px_rgba(0,0,0,0.35),0_1px_2px_rgba(0,0,0,0.2)]",
                            "transition-shadow duration-200",
                            "focus-visible:ring-0 focus-visible:border-primary/40",
                            "focus-visible:shadow-[0_4px_16px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.04)]",
                        )}
                        aria-label={resolveLanguageKey("home.searchPlaceholder")}
                    />
                    {/*<kbd className="pointer-events-none absolute end-7.5 top-1/2 hidden -translate-y-1/2 items-center rounded-lg border bg-muted/70 px-2 py-1 font-mono text-[10px] text-muted-foreground sm:flex">*/}
                    {/*    ⌘K*/}
                    {/*</kbd>*/}
                </div>

                <div className="mx-auto w-full max-w-5xl flex-1 px-4 z-10">
                    {
                        !isSearching && recentLinks.length > 0 &&
                        <>
                            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                                {recentLinks.map((link, i) => (
                                    <RecentChip
                                        key={link.url}
                                        link={link}
                                        color={TILE_COLORS[i % TILE_COLORS.length]}
                                        launchingUrl={launchingUrl}
                                        onLaunch={handleLaunch}
                                    />
                                ))}
                            </div>
                        </>
                    }
                </div>

                <div className="flex-full">
                    <div className="relative mx-auto w-full max-w-5xl flex-1 px-4 md:pb-16">

                        {/* No results */}
                        {!hasResults && (
                            <div className="flex flex-col items-center gap-3 py-20 text-center">
                                <Search className="size-10 text-muted-foreground/25" strokeWidth={1} />
                                <p className="text-sm text-muted-foreground">
                                    {resolveLanguageKey("home.noResults")}
                                </p>
                            </div>
                        )}

                        {/* Sections */}
                        <div className="space-y-10">
                            {[...sections.entries()].map(([sectionTitle, links], sectionIndex) => (
                                <section key={sectionTitle}>
                                    <div className="mb-4 flex items-center gap-2.5">
                                        <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/30" />
                                        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                                            {sectionTitle}
                                        </h2>
                                        <span className="text-[10px] text-muted-foreground/40">{links.length}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                        {links.map((link, linkIndex) => {
                                            const tile = (
                                                <AppTile
                                                    key={`${link.url}-${link.title}`}
                                                    link={link}
                                                    color={TILE_COLORS[(sectionIndex + linkIndex) % TILE_COLORS.length]}
                                                    staggerIndex={staggerIndex}
                                                    launchingUrl={launchingUrl}
                                                    onLaunch={handleLaunch}
                                                />
                                            );
                                            staggerIndex++;
                                            return tile;
                                        })}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>
                </div>



            </div>
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/sidebar/index.tsx"),
)(PanelHomePage);
