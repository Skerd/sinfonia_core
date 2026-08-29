import {IconChevronRight} from "@tabler/icons-react";
import {cn} from "@coreModule/components/lib/utils.ts";

export type Crumb = {key: string; label: string};

type NodeBreadcrumbProps = {
    crumbs: Crumb[];
    onSelect: (key: string) => void;
};

/**
 * Where the selected node sits in the tree.
 *
 * A positional key (`0.1.2`) is precise and tells you nothing — `#DisplayCard[price]` means
 * something different inside `#SheetGroup("pricing")` than at the root. With the tree pane
 * scrolled elsewhere, or filtered, this is often the only thing on screen that says which
 * branch you are editing. Each crumb selects that ancestor, so it doubles as the way back up.
 */
export default function NodeBreadcrumb({crumbs, onSelect}: NodeBreadcrumbProps) {
    if (crumbs.length === 0) return null;

    return (
        <nav aria-label="Node path" className="flex flex-wrap items-center gap-0.5">
            {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1;
                return (
                    <span key={crumb.key} className="flex items-center gap-0.5">
                        {index > 0 && (
                            <IconChevronRight
                                aria-hidden
                                className="size-3 shrink-0 text-muted-foreground/60"
                            />
                        )}
                        <button
                            type="button"
                            disabled={isLast}
                            onClick={() => onSelect(crumb.key)}
                            className={cn(
                                "max-w-[10rem] truncate rounded px-1 font-mono text-3xs",
                                isLast
                                    ? "text-foreground"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                        >
                            {crumb.label}
                        </button>
                    </span>
                );
            })}
        </nav>
    );
}
