import {compose} from "redux";
import {useCallback, useMemo, useState, type ReactNode} from "react";
import {
    IconBuildingCommunity,
    IconChevronDown,
    IconCircleOff,
    IconCrown,
    IconFoldDown,
    IconFoldUp,
    IconHierarchy2,
    IconSearch,
} from "@tabler/icons-react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios from "@coreModule/helpers/hocs/withAxios.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {buttonLike} from "@coreModule/helpers/general/a11y.ts";
import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Collapsible, CollapsibleContent} from "@coreModule/components/ui/collapsible.tsx";
import {Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle} from "@coreModule/components/ui/empty.tsx";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@coreModule/components/ui/input-group.tsx";
import CompanySheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/sheetView/companySheetView.tsx";
import type {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import type {CompanyTreeNode, CompanyTreeResponse} from "armonia/src/modules/core/api/platform/private/companies/platformModules.dto.ts";
import {branchIds, buildCompanyTree, companyTreeStats, filterCompanyTree, type CompanyBranch} from "./companyTree.ts";

type Translate = WithLanguageType["resolveLanguageKey"];

/** Soft initials tiles for companies without a logo, picked by name so a company keeps its colour. */
const INITIALS_TONES = [
    "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    "bg-teal-500/15 text-teal-700 dark:text-teal-300",
];

function initialsTone(name: string): string {
    let hash = 0;
    for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return INITIALS_TONES[hash % INITIALS_TONES.length];
}

function initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toLocaleUpperCase();
}

function counted(t: Translate, key: string, count: number): string {
    return String(t(`${key}.${count === 1 ? "one" : "other"}`)).replace("{count}", String(count));
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

function StatChip({icon, children}: {icon: ReactNode; children: ReactNode}) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground shadow-xs [&>svg]:size-3.5">
            {icon}
            {children}
        </span>
    );
}

type BranchProps = {
    branch: CompanyBranch;
    depth: number;
    query: string;
    isOpen: (id: string) => boolean;
    onToggle: (id: string) => void;
    onOpenCompany: (company: CompanyTreeNode) => void;
    resolveLanguageKey: Translate;
};

/**
 * One company and, below it, the companies created under it. Each child hangs from its parent by an elbow line drawn
 * with the item's own `before`/`after`: the elbow from the item's top to its card, and the line on to the next sibling
 * (the last child has none), so the lines never overlap and stay even on translucent borders.
 */
function CompanyBranchItem({branch, depth, query, isOpen, onToggle, onOpenCompany, resolveLanguageKey: t}: BranchProps) {
    const {company, children, subsidiaries, descendants} = branch;
    const name = company.name ?? "";
    const hasChildren = children.length > 0;
    const open = hasChildren && isOpen(company._id);
    const featured = company.isPlatformOwner;
    const inactive = company.isActive === false;
    const counts = [
        subsidiaries > 0 ? counted(t, "directCompanies", subsidiaries) : undefined,
        descendants > subsidiaries ? counted(t, "allCompanies", descendants) : undefined,
    ].filter((part): part is string => !!part).join(" · ");

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
            <div
                className={cn(
                    "group/node flex items-center gap-1 rounded-xl border bg-card pr-1.5 shadow-xs transition-all duration-200",
                    "hover:-translate-y-px hover:border-primary/40 hover:shadow-md",
                    featured ? "h-16 border-primary/30 bg-linear-to-r from-primary/10 via-card to-card" : "h-14",
                )}
            >
                <div
                    {...buttonLike(() => onOpenCompany(company))}
                    aria-label={String(t("openCompany")).replace("{company}", name)}
                    className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl px-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                    <Avatar
                        className={cn(
                            "shrink-0 border-2 border-background shadow-sm transition-transform group-hover/node:scale-105",
                            featured ? "size-10 ring-2 ring-primary/40" : "size-9",
                            inactive && "grayscale",
                        )}
                    >
                        {company.logo ? <AvatarImage src={`/api/auxiliary/media/${company.logo}`} alt="" /> : null}
                        <AvatarFallback className={cn("text-xs font-semibold", initialsTone(name))}>{initials(name)}</AvatarFallback>
                    </Avatar>
                    <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", inactive && "opacity-60")}>
                        <div className="flex min-w-0 items-center gap-1.5">
                            <span className={cn("truncate font-medium", featured && "text-base font-semibold")}>
                                <Highlighted text={name} query={query} />
                            </span>
                            {featured ? (
                                <Badge className="gap-1">
                                    <IconCrown aria-hidden />
                                    {t("platform")}
                                </Badge>
                            ) : null}
                            {inactive ? <Badge variant="outline" className="text-muted-foreground">{t("inactive")}</Badge> : null}
                            {company.portalApprovalStatus === "pending" ? <Badge variant="secondary">{t("awaitingApproval")}</Badge> : null}
                            {company.portalApprovalStatus === "rejected" ? <Badge variant="destructive">{t("approvalRejected")}</Badge> : null}
                        </div>
                        {company.vat || counts ? (
                            <span className="truncate text-xs text-muted-foreground">
                                {company.vat ? <Highlighted text={company.vat} query={query} /> : null}
                                {company.vat && counts ? " · " : ""}
                                {counts}
                            </span>
                        ) : null}
                    </div>
                </div>
                {hasChildren ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={String(t(open ? "collapseCompany" : "expandCompany")).replace("{company}", name)}
                        aria-expanded={open}
                        onClick={() => onToggle(company._id)}
                        className="shrink-0 text-muted-foreground"
                    >
                        <IconChevronDown className={cn("transition-transform duration-200", !open && "-rotate-90")} />
                    </Button>
                ) : null}
            </div>
            {hasChildren ? (
                <Collapsible open={open}>
                    <CollapsibleContent>
                        <ul className={cn("relative pl-5", featured ? "ml-8" : "ml-7.5")}>
                            {children.map((child) => (
                                <CompanyBranchItem
                                    key={child.company._id}
                                    branch={child}
                                    depth={depth + 1}
                                    query={query}
                                    isOpen={isOpen}
                                    onToggle={onToggle}
                                    onOpenCompany={onOpenCompany}
                                    resolveLanguageKey={t}
                                />
                            ))}
                        </ul>
                    </CollapsibleContent>
                </Collapsible>
            ) : null}
        </li>
    );
}

type CompanyHierarchyProps = WithLanguageType & {companyTree: CompanyTreeResponse | null};

/**
 * Every company on the platform as a tree: each hangs under the company it was created under. A click opens the
 * company's sheet with the same actions as the list; what they change shows on the node at once.
 */
function CompanyHierarchy({companyTree, resolveLanguageKey: t}: CompanyHierarchyProps) {
    // What the sheet's actions changed since the tree loaded, by company.
    const [patches, setPatches] = useState<Record<string, Partial<CompanyTreeNode>>>({});
    const [query, setQuery] = useState("");
    const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
    const [opened, setOpened] = useState<CompanyTreeNode | null>(null);

    const companies = useMemo(
        () => (companyTree?.data ?? []).map((company) => ({...company, ...patches[company._id]})),
        [companyTree, patches],
    );
    const roots = useMemo(() => buildCompanyTree(companies), [companies]);
    const shown = useMemo(() => filterCompanyTree(roots, query), [roots, query]);
    const stats = useMemo(() => companyTreeStats(roots), [roots]);
    const searching = query.trim().length > 0;

    // A search opens every branch on the way to a hit.
    const isOpen = useCallback((id: string) => searching || !collapsed.has(id), [searching, collapsed]);
    const toggle = useCallback((id: string) => {
        setCollapsed((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);
    // Collapsing keeps the top level open, so the companies right under the platform stay in view.
    const collapseAll = () => setCollapsed(new Set(roots.flatMap((root) => branchIds(root.children))));
    const patchOpened = (patch: Partial<CompanyTreeNode>) => {
        if (!opened) return;
        setPatches((current) => ({...current, [opened._id]: {...current[opened._id], ...patch}}));
    };

    return (
        // Capped, so the cards' right edges line up and each level visibly steps in, rather than every row filling a
        // wide screen.
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
                <div className="flex flex-wrap items-center gap-1.5">
                    <StatChip icon={<IconBuildingCommunity aria-hidden />}>{counted(t, "companiesCount", stats.companies)}</StatChip>
                    <StatChip icon={<IconHierarchy2 aria-hidden />}>{counted(t, "levelsCount", stats.levels)}</StatChip>
                    {stats.inactive > 0 ? (
                        <StatChip icon={<IconCircleOff aria-hidden />}>{counted(t, "inactiveCount", stats.inactive)}</StatChip>
                    ) : null}
                </div>
                <div className="ml-auto flex items-center gap-1">
                    <Button type="button" variant="ghost" size="sm" disabled={searching} onClick={() => setCollapsed(new Set())}>
                        <IconFoldDown aria-hidden />
                        {t("expandAll")}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" disabled={searching} onClick={collapseAll}>
                        <IconFoldUp aria-hidden />
                        {t("collapseAll")}
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl border bg-muted/30 p-3 md:p-5">
                {shown.length > 0 ? (
                    <ul aria-label={String(t("title"))} className="flex flex-col gap-3">
                        {shown.map((branch) => (
                            <CompanyBranchItem
                                key={branch.company._id}
                                branch={branch}
                                depth={0}
                                query={query}
                                isOpen={isOpen}
                                onToggle={toggle}
                                onOpenCompany={setOpened}
                                resolveLanguageKey={t}
                            />
                        ))}
                    </ul>
                ) : (
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon"><IconSearch /></EmptyMedia>
                            <EmptyTitle>{t("noMatchTitle")}</EmptyTitle>
                            <EmptyDescription>{String(t("noMatchDescription")).replace("{query}", query.trim())}</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                )}
            </div>

            {opened ? (
                <CompanySheetView
                    open
                    onOpenChange={(next: boolean) => {
                        if (!next) setOpened(null);
                    }}
                    fetchId={opened._id}
                    hideEdit
                    onActivateSuccess={() => patchOpened({isActive: true})}
                    onDeactivateSuccess={() => patchOpened({isActive: false})}
                    onCompanyPatched={(patch: Partial<Company>) => {
                        if (patch.portalApproval) patchOpened({portalApprovalStatus: patch.portalApproval.status});
                    }}
                />
            ) : null}
        </div>
    );
}

export default compose(withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/companies/center/hierarchy/companyHierarchy.tsx"))(
    withAxios<CompanyTreeResponse, Record<string, unknown>, "companyTree">(
        {url: "/api/platform/companies/tree", method: "GET", data: {}},
        false,
        "companyTree",
    )<WithLanguageType>(CompanyHierarchy),
);
