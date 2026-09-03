import {useEffect, useMemo, type ReactNode} from "react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {toPageTitle, type PageTitle} from "@coreModule/helpers/general";
import {usePageHeader} from "@coreModule/helpers/context/pageHeaderContext.tsx";
import {PageHelp, type PageHelpContent} from "@coreModule/components/custom/pageHelp.tsx";

type SimpleHeaderProps = {
    /**
     * A bare string, or {@link buildPageTitle} output when the page is scoped to
     * an entity — context is printed into the heading (`States: Italy`) and
     * also published as breadcrumb crumbs.
     */
    title: string | PageTitle,
    description?: string,
    /** Optional page-overview sheet. The info control sits immediately after the heading. */
    help?: PageHelpContent,
    children?: ReactNode,
    className?: string,
}

function normalize(value: string | undefined) {
    return value?.trim().toLocaleLowerCase() ?? "";
}

/**
 * Page-level heading for panel views.
 *
 * 1. Entity context is published to the shell breadcrumb so the parent names
 *    stay in the trail.
 * 2. That same context is joined into the `<h1>` (`States: Italy`) — publishing
 *    crumbs is not a substitute for the heading; without it a scoped list
 *    reads as the generic resource name.
 * 3. The `<h1>` is hidden visually — not removed — when it would only repeat
 *    the trailing breadcrumb, which is the common case for unscoped list pages
 *    ("Real Estate › Projects" directly above "Projects"). The heading stays in
 *    the accessibility tree so the document outline and screen-reader page
 *    announcement are unchanged; only the duplicated pixels go.
 */
export default function Header({
    title,
    description,
    help,
    children,
    className,
}: SimpleHeaderProps) {
    const pageHeader = usePageHeader();
    const setContextCrumbs = pageHeader?.setContextCrumbs;
    const {title: heading, context} = toPageTitle(title);
    const displayHeading = context.length > 0
        ? `${heading}: ${context.join(" / ")}`
        : heading;

    // Depended on by value, not identity: `context` is a fresh array each render.
    const contextKey = context.join("\u0000");

    useEffect(() => {
        if (!setContextCrumbs) return;
        setContextCrumbs(contextKey ? contextKey.split("\u0000").map((label) => ({label})) : []);
        return () => setContextCrumbs([]);
    }, [contextKey, setContextCrumbs]);

    const isRedundant = useMemo(() => {
        if (!pageHeader || context.length > 0) return false;
        // A subtitle or help control needs a visible heading; hiding the h1
        // would leave an orphaned icon or only muted text.
        if (description?.trim() || help) return false;
        const trail = [...pageHeader.routeCrumbs, ...pageHeader.contextCrumbs];
        return normalize(trail.at(-1)?.label) === normalize(heading);
    }, [pageHeader, context.length, heading, description, help]);

    return (
        <div className={cn("flex min-h-8 items-center justify-between gap-3", className)}>
            <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5">
                    <h1
                        className={cn(
                            isRedundant
                                ? "sr-only"
                                : "truncate text-lg font-semibold tracking-tight md:text-xl",
                        )}
                    >
                        {displayHeading}
                    </h1>
                    {help && <PageHelp help={help} />}
                </div>
                {description && (
                    <p className={cn("truncate text-sm text-muted-foreground", !isRedundant && "mt-0.5")}>
                        {description}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex shrink-0 items-center gap-2">{children}</div>
            )}
        </div>
    )
}
