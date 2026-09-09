import {useMemo, useState} from "react";
import {Link} from "react-router-dom";
import {IconArrowLeft, IconSearch} from "@tabler/icons-react";
import ThemeSwitch from "@coreModule/components/custom/themeSwitch.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Tabs, TabsList, TabsTrigger} from "@coreModule/components/ui/tabs.tsx";
import {useStudioLanguage} from "../preview/previewLanguage.ts";
import {listGalleryEntries, type GalleryEntry} from "./gallerySpecs.ts";
import GalleryWidgetCard from "./galleryWidgetCard.tsx";

type FilterId = "all" | "form" | "sheet";

function matchesFilter(entry: GalleryEntry, filter: FilterId): boolean {
    if (filter === "all") return true;
    if (filter === "form") return entry.form;
    return entry.sheet || entry.overlay;
}

function groupEntries(entries: GalleryEntry[]): {id: string; label: string; entries: GalleryEntry[]}[] {
    const groups: {id: string; label: string; entries: GalleryEntry[]}[] = [];
    for (const entry of entries) {
        const last = groups[groups.length - 1];
        if (last && last.id === entry.groupId) {
            last.entries.push(entry);
            continue;
        }
        groups.push({id: entry.groupId, label: entry.groupLabel, entries: [entry]});
    }
    return groups;
}

/**
 * Live mount of every ViewConfig widget the registry knows, one tile each.
 *
 * The Studio editor previews a single model's config. This page is for changing the
 * components themselves — `#Input`, `#DisplayCard`, `#FormGrid` — and seeing every
 * token the server-driven renderers can produce.
 */
export default function WidgetGalleryPage() {
    const {resolveLanguageKey} = useStudioLanguage("");
    const [filter, setFilter] = useState<FilterId>("all");
    const [query, setQuery] = useState("");

    const entries = listGalleryEntries();

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return entries.filter((entry) => {
            if (!matchesFilter(entry, filter)) return false;
            if (!needle) return true;
            return (
                entry.token.toLowerCase().includes(needle) ||
                entry.groupLabel.toLowerCase().includes(needle)
            );
        });
    }, [entries, filter, query]);

    const groups = useMemo(() => groupEntries(visible), [visible]);
    const showForm = filter !== "sheet";
    const showSheet = filter !== "form";

    return (
        <div className="flex h-svh max-h-svh min-h-0 flex-col overflow-hidden">
            <header className="flex shrink-0 items-center gap-3 border-b px-3 py-2">
                <Button variant="ghost" size="sm" asChild>
                    <Link to="/">
                        <IconArrowLeft />
                        Studio
                    </Link>
                </Button>
                <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">Widget gallery</span>
                    <span className="text-3xs text-muted-foreground">
                        every form / sheet token the view engine can render
                    </span>
                </div>
                <Badge variant="secondary" className="tabular-nums">
                    {visible.length}
                    {visible.length !== entries.length ? ` / ${entries.length}` : ""}
                </Badge>
                <div className="ml-auto">
                    <ThemeSwitch />
                </div>
            </header>

            <div className="flex shrink-0 flex-wrap items-center gap-3 border-b px-3 py-2">
                <Tabs
                    value={filter}
                    onValueChange={(value) => setFilter(value as FilterId)}
                >
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="form">Form</TabsTrigger>
                        <TabsTrigger value="sheet">Sheet</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="flex min-w-48 flex-1 items-center gap-2">
                    <IconSearch className="size-4 shrink-0 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Filter tokens"
                        className="h-8 max-w-sm"
                    />
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-6">
                    {groups.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No widgets match.</p>
                    ) : (
                        groups.map((group) => (
                            <section key={group.id} className="flex flex-col gap-3">
                                <h2 className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {group.label}
                                    <span className="ml-2 tabular-nums">{group.entries.length}</span>
                                </h2>
                                <div className="flex flex-col gap-4">
                                    {group.entries.map((entry) => (
                                        <GalleryWidgetCard
                                            key={entry.token}
                                            entry={entry}
                                            showForm={showForm}
                                            showSheet={showSheet}
                                            resolveLanguageKey={resolveLanguageKey}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
