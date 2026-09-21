import {createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode} from "react";
import {LockKeyhole} from "lucide-react";
import {cn} from "@coreModule/components/lib/utils.ts";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import withLanguage, {type WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {ItemGroup} from "@coreModule/components/ui/item.tsx";
import {CARD_INFO_ROWS_CLASS} from "@coreModule/components/entityPage/list/entityCard.constants.ts";

type RestrictedFieldsApi = {
    /** Idempotent: an already-registered id only updates its label. */
    register: (id: string, label: string) => void;
    unregister: (id: string) => void;
};

const RestrictedFieldsContext = createContext<RestrictedFieldsApi | undefined>(undefined);

/**
 * Registers the current row as unreadable and renders nothing.
 *
 * Returning `null` is the point: the previous behaviour rendered one padlock
 * per restricted field, so a card with six restricted fields showed six
 * identical rows that repeated the same sentence six times and pushed the
 * readable fields out of view. The group aggregates them into one line.
 *
 * Non-throwing when no group is present — the row is simply omitted, which is
 * still an improvement over a lock column, and card bodies are migrated to
 * `InfoRowGroup` incrementally.
 */
export function useRestrictedField(id: string, label: string, restricted: boolean) {
    const api = useContext(RestrictedFieldsContext);

    useEffect(() => {
        if (!restricted || !api) return;
        api.register(id, label);
        return () => api.unregister(id);
    }, [api, id, label, restricted]);
}

const LAYOUT_CLASS = {
    /** Entity card bodies: flow and wrap horizontally. */
    wrap: cn("flex-row", CARD_INFO_ROWS_CLASS),
    /** Profile / detail panels: one field per line. */
    stack: "flex-col gap-y-1.5",
} as const;

export type InfoRowGroupProps = {
    children: ReactNode;
    className?: string;
    /**
     * `wrap` (default) for entity-card metadata; `stack` for profile/detail
     * panels. Prefer this over fighting wrap with `flex-col !gap-*`.
     */
    layout?: keyof typeof LAYOUT_CLASS;
};

/**
 * Card metadata container. Wraps rows in `ItemGroup` for the shared list
 * semantics and collects the fields the current user may not read, so the card
 * can state the restriction once instead of once per field.
 *
 * `ItemGroup` is vertical by default; `layout="wrap"` overlays the horizontal
 * flow from `CARD_INFO_ROWS_CLASS`.
 */
export function InfoRowGroup({children, className, layout = "wrap"}: InfoRowGroupProps) {
    const [restricted, setRestricted] = useState<Record<string, string>>({});

    const register = useCallback((id: string, label: string) => {
        setRestricted((prev) => (prev[id] === label ? prev : {...prev, [id]: label}));
    }, []);

    const unregister = useCallback((id: string) => {
        setRestricted((prev) => {
            if (!(id in prev)) return prev;
            const {[id]: _removed, ...rest} = prev;
            return rest;
        });
    }, []);

    const api = useMemo(() => ({register, unregister}), [register, unregister]);
    const labels = useMemo(() => Object.values(restricted), [restricted]);

    return (
        <RestrictedFieldsContext value={api}>
            <ItemGroup className={cn(LAYOUT_CLASS[layout], className)}>
                {children}
                {/* Guarded rather than letting the notice return null: it is wrapped in
                    `withLanguage`, so mounting it costs a store subscription and a dictionary
                    load per card even when there is nothing restricted to report. */}
                {labels.length > 0 ? <RestrictedFieldsNotice labels={labels} /> : null}
            </ItemGroup>
        </RestrictedFieldsContext>
    );
}

type RestrictedFieldsNoticeProps = WithLanguageType & {
    labels: string[];
};

function RestrictedFieldsNoticeBase({labels, resolveLanguageKey}: RestrictedFieldsNoticeProps) {
    const template = String(labels.length === 1 ? resolveLanguageKey("one") : resolveLanguageKey("many"));
    const summary = template.replace("{count}", String(labels.length));
    const permissionHint = String(resolveLanguageKey("tooltip"));
    const fieldList = labels.join(", ");
    const tooltip = `${permissionHint}: ${fieldList}`;

    return (
        <TooltipDisplayer tooltip={tooltip}>
            <span
                role="listitem"
                tabIndex={0}
                className="inline-flex w-fit items-center gap-1 text-2xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-slot="restricted-fields"
                aria-label={`${summary}. ${tooltip}`}
            >
                <LockKeyhole size={12} aria-hidden />
                {summary}
            </span>
        </TooltipDisplayer>
    );
}

const RestrictedFieldsNotice = withLanguage(
    "src/modules/core/components/custom/infoRowGroup.tsx",
)(RestrictedFieldsNoticeBase);
