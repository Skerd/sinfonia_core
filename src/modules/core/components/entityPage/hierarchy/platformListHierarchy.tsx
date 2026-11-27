import {compose} from "redux";
import {useCallback, useEffect, useState, type ReactNode} from "react";
import {useSearchParams} from "react-router-dom";
import {IconCategory2, IconChevronDown, IconFoldUp, IconHierarchy2, IconList, IconRefresh, IconSearch} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {cn} from "@coreModule/components/lib/utils.ts";
import {buttonLike} from "@coreModule/helpers/general/a11y.ts";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {ToggleGroup, ToggleGroupItem} from "@coreModule/components/ui/toggle-group.tsx";
import {Collapsible, CollapsibleContent} from "@coreModule/components/ui/collapsible.tsx";
import {Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle} from "@coreModule/components/ui/empty.tsx";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@coreModule/components/ui/input-group.tsx";
import Loader from "@coreModule/components/custom/loader/loader.tsx";
import {StatChip} from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/hierarchy/companyHierarchy.tsx";
import {counted} from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/hierarchy/companyTree.ts";
import type {
    PlatformListTreeNode as CategoryTreeNode,
    PlatformListTreeResponse as CategoryTreeResponse,
} from "armonia/src/modules/core/api/platform/private/platformListTree/platformListTree.types.ts";

type Translate = WithLanguageType["resolveLanguageKey"];
const SEARCH_DEBOUNCE_MS = 300;

export type PlatformListView = "list" | "hierarchy";

/** The page's view, kept in the URL (`?view=hierarchy`) so a reload or a shared link opens the same one. */
export function usePlatformListView(): [PlatformListView, (next: string) => void] {
    const [searchParams, setSearchParams] = useSearchParams();
    const view: PlatformListView = searchParams.get("view") === "hierarchy" ? "hierarchy" : "list";
    const setView = useCallback((next: string) => {
        // Radix clears the value when the active item is pressed again; the page always shows one view.
        if (next !== "list" && next !== "hierarchy") return;
        setSearchParams((prev) => {
            const params = new URLSearchParams(prev);
            if (next === "hierarchy") params.set("view", "hierarchy");
            else params.delete("view");
            return params;
        }, {replace: true});
    }, [setSearchParams]);
    return [view, setView];
}

/** Switches a tree-shaped platform list's page between its list and its hierarchy; labels from the page (`views.*`). */
export function PlatformListViewSwitch({view, onChange, resolveLanguageKey}: {view: PlatformListView; onChange: (next: string) => void} & Pick<WithLanguageType, "resolveLanguageKey">) {
    return (
        <ToggleGroup type="single" spacing={0} variant="outline" size="sm" value={view} onValueChange={onChange} aria-label={resolveLanguageKey("views.label")}>
            <ToggleGroupItem value="list" className="gap-1.5 px-2.5">
                <IconList aria-hidden />
                {resolveLanguageKey("views.list")}
            </ToggleGroupItem>
            <ToggleGroupItem value="hierarchy" className="gap-1.5 px-2.5">
                <IconHierarchy2 aria-hidden />
                {resolveLanguageKey("views.hierarchy")}
            </ToggleGroupItem>
        </ToggleGroup>
    );
}

/** The name with the searched text marked. */
function Highlighted({text, query}: {text: string; query: string}) {
    const needle = query.trim().toLocaleLowerCase();
    const at = needle ? text.toLocaleLowerCase().indexOf(needle) : -1;
    if (at < 0) return <>{text}</>;
    return (
        <>
            {text.slice(0, at)}
            <mark className="rounded-sm bg-primary/15 px-0.5 text-foreground">{text.slice(at, at + needle.length)}</mark>
            {text.slice(at + needle.length)}
        </>
    );
}

/** A category's card: opens its sheet; the chevron shows or hides the categories under it. */
function CategoryCard({node, open, onToggle, onOpen, query, t}: {
    node: CategoryTreeNode;
    open?: boolean;
    onToggle?: () => void;
    onOpen: () => void;
    query: string;
    t: Translate;
}) {
    return (
        <div className="group/node flex h-14 items-center gap-1 rounded-xl border bg-card pr-1.5 shadow-xs transition-all duration-200 hover:-translate-y-px hover:border-primary/40 hover:shadow-md">
            <div
                {...buttonLike(onOpen)}
                aria-label={String(t("openCategory")).replace("{category}", node.name)}
                className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl px-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&>svg]:size-4.5">
                    <IconCategory2 aria-hidden />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate font-medium"><Highlighted text={node.name} query={query} /></span>
                        {node.requestStatus === "requested" ? <Badge variant="secondary">{t("requested")}</Badge> : null}
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                        {node.path?.length ? `${node.path.join(" › ")}${node.childCount > 0 ? " · " : ""}` : ""}
                        {node.childCount > 0 ? counted(t, "subcategories", node.childCount) : node.path?.length ? "" : t("noSubcategories")}
                    </span>
                </div>
            </div>
            {onToggle && node.childCount > 0 ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={String(t(open ? "collapseCategory" : "expandCategory")).replace("{category}", node.name)}
                    aria-expanded={open}
                    onClick={onToggle}
                    className="shrink-0 text-muted-foreground"
                >
                    <IconChevronDown className={cn("transition-transform duration-200", !open && "-rotate-90")} />
                </Button>
            ) : null}
        </div>
    );
}

type TreeProps = {
    request: HttpRequest;
    expanded: ReadonlySet<string>;
    onToggle: (node: CategoryTreeNode) => void;
    onOpen: (node: CategoryTreeNode) => void;
    t: Translate;
};

/** One category and, once opened, the categories under it, loaded when it opens. */
function CategoryBranch({node, depth, request, expanded, onToggle, onOpen, t}: TreeProps & {node: CategoryTreeNode; depth: number}) {
    const open = expanded.has(node._id);
    return (
        <li
            className={cn(
                "relative",
                depth > 0 && [
                    "pt-2",
                    "before:pointer-events-none before:absolute before:-left-5 before:top-0 before:h-9 before:w-5 before:rounded-bl-xl before:border-b before:border-l before:border-muted-foreground/30",
                    "after:pointer-events-none after:absolute after:-left-5 after:top-9 after:bottom-0 after:border-l after:border-muted-foreground/30 last:after:hidden",
                ],
            )}
        >
            <CategoryCard node={node} open={open} onToggle={() => onToggle(node)} onOpen={() => onOpen(node)} query="" t={t} />
            {node.childCount > 0 ? (
                <Collapsible open={open}>
                    <CollapsibleContent>
                        <ul className="relative ml-7.5 pl-5">
                            {open ? <TreeLevel parentId={node._id} depth={depth + 1} request={request} expanded={expanded} onToggle={onToggle} onOpen={onOpen} t={t} /> : null}
                        </ul>
                    </CollapsibleContent>
                </Collapsible>
            ) : null}
        </li>
    );
}

/** The categories of one level (the top level without a parent), loaded from the server, with a retry when it fails. */
function TreeLevel({parentId, depth, request, expanded, onToggle, onOpen, t}: TreeProps & {parentId?: string; depth: number}) {
    const [fetchCount, setFetchCount] = useState(1);
    const {data, error, loading} = useHttpRequest<CategoryTreeResponse>(request, parentId ? {parent: parentId} : {}, fetchCount);
    if (error) {
        return (
            <li className="flex items-center gap-2 py-2 text-sm text-destructive">
                {t("loadError")}
                <Button type="button" variant="outline" size="sm" onClick={() => setFetchCount((count) => count + 1)}>
                    <IconRefresh aria-hidden />
                    {t("retry")}
                </Button>
            </li>
        );
    }
    if (loading || !data) return <li className="py-2"><Loader /></li>;
    return (
        <>
            {data.data.map((child) => (
                <CategoryBranch key={child._id} node={child} depth={depth} request={request} expanded={expanded} onToggle={onToggle} onOpen={onOpen} t={t} />
            ))}
            {data.truncated ? <li className="pt-2 text-xs text-muted-foreground">{t("truncated")}</li> : null}
        </>
    );
}

/** Matches for a search in any language, each with its path. */
function SearchResults({request, term, onOpen, t}: {request: HttpRequest; term: string; onOpen: (node: CategoryTreeNode) => void; t: Translate}) {
    const [fetchCount, setFetchCount] = useState(0);
    // Each new term is a new request (the hook fetches when its count changes).
    useEffect(() => setFetchCount((count) => count + 1), [term]);
    const {data, error, loading} = useHttpRequest<CategoryTreeResponse>(request, {search: term}, fetchCount);
    if (error) return <p className="text-sm text-destructive">{t("loadError")}</p>;
    if (loading || !data) return <Loader />;
    if (data.data.length === 0) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyMedia variant="icon"><IconSearch /></EmptyMedia>
                    <EmptyTitle>{t("noMatchTitle")}</EmptyTitle>
                    <EmptyDescription>{String(t("noMatchDescription")).replace("{query}", term)}</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }
    return (
        <ul aria-label={String(t("title"))} className="flex flex-col gap-2">
            {data.data.map((node) => (
                <li key={node._id}>
                    <CategoryCard node={node} onOpen={() => onOpen(node)} query={term} t={t} />
                </li>
            ))}
            {data.truncated ? <li className="pt-1 text-xs text-muted-foreground">{t("truncatedSearch")}</li> : null}
        </ul>
    );
}

/** The count of top-level categories, for the stat chip. */
function TopLevelCount({request, t}: {request: HttpRequest; t: Translate}) {
    const {data} = useHttpRequest<CategoryTreeResponse>(request, {}, 1);
    return data ? <StatChip icon={<IconHierarchy2 aria-hidden />}>{counted(t, "topLevelCount", data.data.length)}</StatChip> : null;
}

/** What a page gives the hierarchy view: where its tree is, and the sheet of an entry the view opens. */
export type PlatformListHierarchyProps = {
    /** The list's `POST /tree` route (core `addPlatformListTreeRoute`), e.g. `/api/eCommerce/category/tree`. */
    treeUrl: string;
    /** The entry's sheet, with the list's actions; `onDeleted` reloads the tree from the top. */
    renderSheet: (entry: {id: string; onClose: () => void; onDeleted: () => void}) => ReactNode;
};

/**
 * A tree-shaped platform list as a tree (D195 product categories, D196 service categories): the top level first, and
 * each branch loaded when it is opened, since the trees hold thousands. A search finds entries in any language and
 * shows each one's path. A click opens the entry's sheet.
 */
function PlatformListHierarchy({treeUrl, renderSheet, resolveLanguageKey: t}: PlatformListHierarchyProps & WithLanguageType) {
    const request: HttpRequest = {method: "POST", url: treeUrl};
    const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
    const [query, setQuery] = useState("");
    const [term, setTerm] = useState("");
    const [opened, setOpened] = useState<CategoryTreeNode | null>(null);
    // Bumped when a category is deleted: the tree loads again from the top.
    const [treeKey, setTreeKey] = useState(0);

    // The search waits for a pause in typing (the tree is too big to filter here).
    useEffect(() => {
        const timer = setTimeout(() => setTerm(query.trim()), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [query]);

    const toggle = useCallback((node: CategoryTreeNode) => {
        setExpanded((current) => {
            const next = new Set(current);
            if (next.has(node._id)) next.delete(node._id);
            else next.add(node._id);
            return next;
        });
    }, []);

    const searching = term.length > 0;

    return (
        <div className="flex w-full min-w-0 max-w-4xl flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
                <InputGroup className="w-full sm:w-72">
                    <InputGroupAddon><IconSearch aria-hidden /></InputGroupAddon>
                    <InputGroupInput
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={String(t("search"))}
                        aria-label={String(t("search"))}
                    />
                </InputGroup>
                <TopLevelCount key={treeKey} request={request} t={t} />
                <div className="ml-auto flex items-center gap-1">
                    <Button type="button" variant="ghost" size="sm" disabled={searching || expanded.size === 0} onClick={() => setExpanded(new Set())}>
                        <IconFoldUp aria-hidden />
                        {t("collapseAll")}
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl border bg-muted/30 p-3 md:p-5">
                {searching ? (
                    <SearchResults key={treeKey} request={request} term={term} onOpen={setOpened} t={t} />
                ) : (
                    <ul key={treeKey} aria-label={String(t("title"))} className="flex flex-col gap-3">
                        <TreeLevel depth={0} request={request} expanded={expanded} onToggle={toggle} onOpen={setOpened} t={t} />
                    </ul>
                )}
            </div>

            {opened ? renderSheet({
                id: opened._id,
                onClose: () => setOpened(null),
                // A deleted entry leaves the tree: it loads again.
                onDeleted: () => {
                    setOpened(null);
                    setExpanded(new Set());
                    setTreeKey((key) => key + 1);
                },
            }) : null}
        </div>
    );
}

const PlatformListHierarchyWithLanguage = compose(withLanguage("src/modules/core/components/entityPage/hierarchy/platformListHierarchy.tsx"))(PlatformListHierarchy);

/** The hierarchy view with its props typed for the pages (the language wrapper takes any props). */
export default function PlatformListHierarchyView(props: PlatformListHierarchyProps) {
    return <PlatformListHierarchyWithLanguage {...props} />;
}
