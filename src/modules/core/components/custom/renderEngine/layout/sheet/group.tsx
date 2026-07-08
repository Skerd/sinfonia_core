import {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type { ReactNode } from "react";

type SheetGroupProps = {
    title?: string;
    /** Optional icon element (Tabler `#…` token is resolved to an element in `ViewRenderer` for `#SheetGroup`). */
    titleIcon?: ReactNode;
    /** Optional trailing controls in the title row (e.g. `#ReferencesViewModeToggle` resolved in `ViewRenderer`). */
    titleActions?: ReactNode;
    resolveLanguageKey?: ResolveLanguageKey;
    children?: ReactNode;
};

export function SheetGroup({ title, titleIcon, titleActions, resolveLanguageKey, children }: SheetGroupProps) {
    const label = resolveLanguageKey && title ? String(resolveLanguageKey(title)) : title;
    return (
        <div className="space-y-2">
            {
                label &&
                <div className="flex items-center justify-between gap-2 w-full min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                        {titleIcon != null ? (
                            <div className="shrink-0 rounded-md bg-background p-1">{titleIcon}</div>
                        ) : null}
                        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            {label}
                        </p>
                    </div>
                    {titleActions != null ? (
                        <div className="shrink-0 flex items-center">{titleActions}</div>
                    ) : null}
                </div>
            }
            {children}
        </div>
    );
}
