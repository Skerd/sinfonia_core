import {compose} from "redux";
import {useEffect, useMemo, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useSelector} from "react-redux";
import withLanguage, {type WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {getPanelNavGroups} from "@coreModule/helpers/panel/panelNavGroups.ts";
import {flattenPanelNavLinks, type FlatPanelNavLink} from "@coreModule/helpers/panel/flattenPanelNavLinks.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Empty, EmptyHeader, EmptyMedia, EmptyTitle} from "@coreModule/components/ui/empty.tsx";
import {LayoutGrid, Search} from "lucide-react";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Kbd, KbdGroup} from "@coreModule/components/ui/kbd.tsx";

const TILE_COLORS = [
    {
        icon: "from-primary/25 to-primary/25 text-primary border-primary/70 dark:border-primary/40 shadow-primary/15",
        chip: "bg-primary/10 text-primary border-primary/30 hover:bg-primary/10 dark:bg-primary/40 dark:border-primary/50 dark:hover:bg-primary/60",
        glow: "oklch(0.60 0.28 292 / 0.18)",
    },
    {
        icon: "from-info/25 to-info/25 text-info border-info/70 dark:border-info/40 shadow-info/15",
        chip: "bg-info/10 text-info border-info/30 hover:bg-info/10 dark:bg-info/40 dark:border-info/50 dark:hover:bg-info/60",
        glow: "oklch(0.60 0.22 228 / 0.18)",
    },
    {
        icon: "from-success/25 to-success/25 text-success border-success/70 dark:border-success/40 shadow-success/15",
        chip: "bg-success/10 text-success border-success/30 hover:bg-success/10 dark:bg-success/40 dark:border-success/50 dark:hover:bg-success/60",
        glow: "oklch(0.60 0.20 160 / 0.18)",
    },
    {
        icon: "from-warning/25 to-warning/25 text-warning border-warning/70 dark:border-warning/40 shadow-warning/15",
        chip: "bg-warning/10 text-warning border-warning/30 hover:bg-warning/10 dark:bg-warning/40 dark:border-warning/50 dark:hover:bg-warning/60",
        glow: "oklch(0.72 0.20 70 / 0.18)",
    },
    {
        icon: "from-destructive/25 to-primary/25 text-destructive border-destructive/70 dark:border-destructive/40 shadow-destructive/15",
        chip: "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/10 dark:bg-destructive/40 dark:border-destructive/50 dark:hover:bg-destructive/60",
        glow: "oklch(0.62 0.25 10 / 0.18)",
    },
    {
        icon: "from-info/25 to-info/25 text-info border-info/70 dark:border-info/40 shadow-info/15",
        chip: "bg-info/10 text-info border-info/30 hover:bg-info/10 dark:bg-info/40 dark:border-info/50 dark:hover:bg-info/60",
        glow: "oklch(0.65 0.18 200 / 0.18)",
    },
    {
        icon: "from-warning/25 to-destructive/25 text-warning border-warning/70 dark:border-warning/40 shadow-warning/15",
        chip: "bg-warning/10 text-warning border-warning/30 hover:bg-warning/10 dark:bg-warning/40 dark:border-warning/50 dark:hover:bg-warning/60",
        glow: "oklch(0.68 0.22 42 / 0.18)",
    },
    {
        icon: "from-info/25 to-info/25 text-info border-info/70 dark:border-info/40 shadow-info/15",
        chip: "bg-info/10 text-info border-info/30 hover:bg-info/10 dark:bg-info/40 dark:border-info/50 dark:hover:bg-info/60",
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
                    // Same token-driven elevation as the Card primitive, so dark mode needs no override.
                    "bg-card shadow-sm ring-1 ring-foreground/10",
                    "transition-[transform,opacity] duration-220 ease-out",
                    !isLaunching && "hover:-translate-y-1 hover:ring-primary/30",
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
                        <Badge variant="secondary" className="px-1.5 py-0 text-3xs">
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

    const navigate = useNavigate();
    const [launchingUrl, setLaunchingUrl] = useState<string | null>(null);

    const user = useSelector((state: RootState) => state.authentication.user);
    const channelsUnread = useSelector((state: RootState) => state.chat.channelsUnread);
    const chatUnreadTotal = Object.values(channelsUnread ?? {}).reduce((a, b) => a + b, 0);

    const allLinks = useMemo(() => {
        const groups = getPanelNavGroups(resolveLanguageKey, {chatUnreadTotal});
        return flattenPanelNavLinks(groups);
    }, [resolveLanguageKey, chatUnreadTotal]);

    const {recentLinks, trackVisit} = useRecentLinks(allLinks);

    const sections = useMemo(() => groupLinksBySection(allLinks), [allLinks]);

    const hasResults = sections.size > 0;
    const greeting = buildGreeting(user?.name ?? "", resolveLanguageKey);

    // Navigate after the launch animation finishes
    useEffect(() => {
        if (!launchingUrl) return;
        navigate(launchingUrl);
    }, [launchingUrl, navigate]);

    function handleLaunch(url: string) {
        trackVisit(url);
        setLaunchingUrl(url);
    }

    let staggerIndex = 0;

    return (
        <div className="relative flex min-h-0 flex-1 flex-col gap-4">

            <div className="pointer-events-none absolute inset-x-0 top-0 h-[200px] overflow-hidden" aria-hidden>
                <div
                    className="absolute left-1/2 top-0 h-40 w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-[0.06] dark:opacity-[0.11]"
                    style={{background: "radial-gradient(ellipse, oklch(0.62 0.22 264) 0%, transparent 100%)"}}
                />
            </div>

            <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pt-6 md:pb-16">
                <div className="text-center">
                    <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl">{greeting}</h1>
                    <p className="mt-2 text-sm text-muted-foreground md:text-base">{resolveLanguageKey("home.subtitle")}</p>
                </div>

                <div className="relative w-full">
                    <button
                        type="button"
                        className={cn(
                            "flex h-12 w-full items-center gap-3 rounded-2xl pe-4 ps-11 text-start text-sm",
                            "border border-border/60 bg-card shadow-e1 text-muted-foreground",
                            "transition-shadow duration-200 hover:shadow-e2",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        )}
                        onClick={() => window.dispatchEvent(new CustomEvent("panel:open-command-palette"))}
                        aria-label={String(resolveLanguageKey("home.searchPlaceholder") || "Search")}
                    >
                        <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <span className="flex-1 truncate">{resolveLanguageKey("home.searchPlaceholder")}</span>
                        <KbdGroup className="pointer-events-none hidden sm:inline-flex">
                            <Kbd>⌘</Kbd>
                            <Kbd>K</Kbd>
                        </KbdGroup>
                    </button>
                </div>

                {recentLinks.length > 0 && (
                    <div className="z-10 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
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
                )}

                {!hasResults && (
                    <Empty className="py-20">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Search />
                            </EmptyMedia>
                            <EmptyTitle>{resolveLanguageKey("home.noResults")}</EmptyTitle>
                        </EmptyHeader>
                    </Empty>
                )}

                <div className="flex flex-col gap-10">
                    {[...sections.entries()].map(([sectionTitle, links], sectionIndex) => (
                        <section key={sectionTitle}>
                            <div className="mb-4 flex items-center gap-2.5">
                                <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/30" />
                                <h2 className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
                                    {sectionTitle}
                                </h2>
                                <span className="text-3xs text-muted-foreground/40">{links.length}</span>
                            </div>
                            {/* Same intrinsic policy as the entity grids, at tile scale. */}
                            <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(9rem,100%),1fr))]">
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
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/sidebar/index.tsx"),
)(PanelHomePage);
