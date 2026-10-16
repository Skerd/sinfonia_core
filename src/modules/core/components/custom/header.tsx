import {useMemo, type ReactNode} from "react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {usePageHeader} from "@coreModule/helpers/context/pageHeaderContext.tsx";
import {usePageContextCrumbs} from "@coreModule/helpers/hooks/usePageContextCrumbs.ts";
import {PageHelp, type PageHelpContent} from "@coreModule/components/custom/pageHelp.tsx";
import {PageTitle} from "@coreModule/helpers/types/pageTitle.types.ts";
import TruncatedValue from "@coreModule/components/viewEngine/widgets/display/truncatedValue.tsx";

type SimpleHeaderProps = {
    /**
     * A bare string, or {@link buildPageTitle} output when the page is scoped to
     * an entity — context is printed into the heading (`States: Italy`) and
     * also published as breadcrumb crumbs.
     */
    title: string | PageTitle;
    description?: string;
    /** Optional page-overview sheet. The info control sits immediately after the heading. */
    help?: PageHelpContent;
    children?: ReactNode;
    className?: string;
};

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
 *
 * The toolbar stays on the title row. The heading keeps a readable minimum
 * and truncates; only a toolbar that cannot fit beside that minimum wraps.
 */
export default function Header({
    title,
    description,
    help,
    children,
    className,
}: SimpleHeaderProps) {
    const pageHeader = usePageHeader();
    const {title: heading, context} = typeof title === "string" ? {title: title, context: []} : title;
    const displayHeading = context.length > 0 ? `${heading}: ${context.join(" / ")}` : heading;

    usePageContextCrumbs(context.map((label) => ({label})));

    const isRedundant = useMemo(() => {
        if (!pageHeader || context.length > 0) return false;
        // A subtitle or help control needs a visible heading; hiding the h1
        // would leave an orphaned icon or only muted text.
        if (description?.trim() || help) return false;
        return normalize(pageHeader.trail.at(-1)?.label) === normalize(heading);
    }, [pageHeader, context.length, heading, description, help]);

    return (
        <div
            className={cn(
                "flex flex-wrap items-start justify-between gap-x-3 gap-y-2",
                className,
            )}
        >
            <div className="min-w-[10rem] max-w-full flex-1">
                <div className="flex min-w-0 items-center gap-1.5">
                    <TruncatedValue
                        as="h1"
                        text={displayHeading}
                        className={cn(isRedundant ? "sr-only" : "text-lg font-semibold tracking-tight md:text-xl")}
                    >
                        {displayHeading}
                    </TruncatedValue>
                    {help ? <PageHelp help={help} /> : null}
                </div>
                {description ? (
                    <TruncatedValue
                        as="p"
                        text={description}
                        className={cn("text-sm text-muted-foreground", !isRedundant && "mt-0.5")}
                    >
                        {description}
                    </TruncatedValue>
                ) : null}
            </div>
            {children ? (
                <div className="ms-auto flex shrink-0 items-center justify-end gap-2">{children}</div>
            ) : null}
        </div>
    );
}
