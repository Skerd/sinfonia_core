import {useEffect, useMemo, type ReactNode} from "react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {toPageTitle, type PageTitle} from "@coreModule/helpers/general";
import {usePageHeader} from "@coreModule/helpers/context/pageHeaderContext.tsx";

type SimpleHeaderProps = {
    /**
     * A bare string, or {@link buildPageTitle} output when the page is scoped to
     * an entity — the context segments become breadcrumb crumbs rather than
     * being flattened into the heading.
     */
    title: string | PageTitle,
    description?: string,
    children?: ReactNode,
    className?: string,
}

function normalize(value: string | undefined) {
    return value?.trim().toLocaleLowerCase() ?? "";
}

/**
 * Page-level heading for panel views.
 *
 * Two things happen here that used to be three separate headers:
 *
 * 1. Entity context is published to the shell breadcrumb instead of being
 *    printed into the title, so it stays navigable.
 * 2. The `<h1>` is hidden visually — not removed — when it would only repeat
 *    the trailing breadcrumb, which is the common case for every list page
 *    ("Real Estate › Projects" directly above "Projects"). The heading stays in
 *    the accessibility tree so the document outline and screen-reader page
 *    announcement are unchanged; only the duplicated pixels go.
 */
export default function Header({
    title,
    description,
    children,
    className,
}: SimpleHeaderProps) {
    const pageHeader = usePageHeader();
    const setContextCrumbs = pageHeader?.setContextCrumbs;
    const {title: heading, context} = toPageTitle(title);

    // Depended on by value, not identity: `context` is a fresh array each render.
    const contextKey = context.join("\u0000");

    useEffect(() => {
        if (!setContextCrumbs) return;
        setContextCrumbs(contextKey ? contextKey.split("\u0000").map((label) => ({label})) : []);
        return () => setContextCrumbs([]);
    }, [contextKey, setContextCrumbs]);

    const isRedundant = useMemo(() => {
        if (!pageHeader || context.length > 0) return false;
        const trail = [...pageHeader.routeCrumbs, ...pageHeader.contextCrumbs];
        return normalize(trail.at(-1)?.label) === normalize(heading);
    }, [pageHeader, context.length, heading]);

    return (
        <div className={cn("flex min-h-8 items-center justify-between gap-3", className)}>
            <div className="min-w-0 flex-1">
                <h1
                    className={cn(
                        isRedundant
                            ? "sr-only"
                            : "truncate text-lg font-semibold tracking-tight md:text-xl",
                    )}
                >
                    {heading}
                </h1>
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
