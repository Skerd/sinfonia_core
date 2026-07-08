import { compose } from "redux";
import withLanguage, { WithLanguageType } from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import { Switch } from "@coreModule/components/ui/switch.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";
import { useReferencesViewModeOptional } from "./referencesViewModeContext.tsx";

function ReferencesViewModeToggle({
    resolveLanguageKey,
    sheetLanguageKey,
}: WithLanguageType & { sheetLanguageKey?: WithLanguageType["resolveLanguageKey"] }) {
    const resolve = sheetLanguageKey ?? resolveLanguageKey;
    const ctx = useReferencesViewModeOptional();
    if (!ctx || !ctx.hasItems) {
        return null;
    }
    const isCards = ctx.mode === "cards";
    return (
        <div
            className="flex items-center gap-2 shrink-0"
            role="group"
            aria-label={String(resolve("toggleReferenceListView"))}
        >
            <span
                className={cn(
                    "text-xs text-muted-foreground whitespace-nowrap",
                    !isCards && "font-semibold text-foreground",
                )}
            >
                {resolve("compactView")}
            </span>
            <Switch
                checked={isCards}
                onCheckedChange={(c) => ctx.setMode(c ? "cards" : "compact")}
                aria-label={String(resolve("toggleReferenceListView"))}
            />
            <span
                className={cn(
                    "text-xs text-muted-foreground whitespace-nowrap",
                    isCards && "font-semibold text-foreground",
                )}
            >
                {resolve("cardsView")}
            </span>
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/components/viewEngine/referencesViewModeToggle.tsx"),
    withDebug(true, true),
)(ReferencesViewModeToggle);
