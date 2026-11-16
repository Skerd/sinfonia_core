import {useMemo} from "react";
import {useSelector} from "react-redux";
import {useNavigate} from "react-router-dom";
import {IconArrowBackUp, IconBuilding, IconCalendar, IconCalendarCheck, IconCircleCheck, IconCircleDot, IconCircleX, IconInfoCircle, IconNotes, IconSend} from "@tabler/icons-react";
import {DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator} from "@coreModule/components/ui/dropdown-menu.tsx";
import StatusBadge from "@coreModule/components/entityPage/sheet/statusBadge.tsx";
import EntityCardRow from "@coreModule/components/entityPage/list/card/entityCardRow.tsx";
import {InfoRowGroup} from "@coreModule/components/custom/infoRowGroup.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@coreModule/components/ui/popover.tsx";
import {Button, ButtonTitle} from "@coreModule/components/ui/button.tsx";
import type {QuickFilterDef} from "@coreModule/components/entityPage/filters/quickFilterBar.tsx";
import {useActionAccess} from "@coreModule/helpers/hooks/useActionAccess.ts";
import {useDynamicLanguage} from "@coreModule/helpers/hooks/useDynamicLanguage.ts";
import {useIsPlatformCompany} from "@coreModule/helpers/hooks/useIsPlatformCompany.ts";
import type {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators.ts";
import {type DeletedData, REQUEST_STATUS_VALUES, type RequestableData} from "armonia/src/modules/core/types/shared.types.ts";

/**
 * The panel side of a requestable platform list (maestro `requestablePlugin`, D160), used by the shared list, card, sheet
 * and create page whenever the access map flags a model `requestable`, so no list page wires it itself: a company other
 * than the platform creates a missing entry with the list's own create form, the entry waits as "requested", and the
 * platform approves or rejects it from the row, card or sheet menu; the requester may withdraw it.
 */

const LANGUAGE_PATH = "src/modules/core/components/entityPage/requestable/requestableEntry.tsx";

export type RequestableEntry = RequestableData & DeletedData & {_id: string; name?: unknown};

export type RequestDecision = "approve" | "reject" | "withdraw";

const REQUEST_DECISIONS: readonly RequestDecision[] = ["approve", "reject", "withdraw"];

/**
 * A request that was turned down or taken back: the entry is deleted, yet its requester (and the platform) still see it,
 * with its status and reason, even without the restore grant every other deleted record needs (D160).
 */
export function isClosedRequest(entry: object): boolean {
    const status = "requestStatus" in entry ? entry.requestStatus : undefined;
    return status === "rejected" || status === "withdrawn";
}

/** A row or card action that is a decision on a requested entry. */
export function isRequestDecision(action: string): action is RequestDecision {
    return REQUEST_DECISIONS.some((decision) => decision === action);
}

type MenuProps = {
    entry: RequestableEntry;
    /** The list's collection, whose `request` / `decideRequest` action permissions apply. */
    collection: string;
    onAction: (decision: RequestDecision) => void;
};

function useOfferedDecisions(entry: RequestableEntry, collection: string): RequestDecision[] {
    const sessionCompanyId = useSelector((state: RootState) => state.authentication.user.company._id);
    const isPlatformCompany = useIsPlatformCompany();
    const canDecide = useActionAccess(collection, "decideRequest");
    const canRequest = useActionAccess(collection, "request");
    if (entry.deletedAt || entry.requestStatus !== "requested") return [];
    return REQUEST_DECISIONS.filter((decision) => decision === "withdraw"
        ? canRequest && entry.requestedByCompany === sessionCompanyId
        : canDecide && isPlatformCompany);
}

/**
 * The heading over View / Edit / Delete / Restore (ActionMenu `standardMenuLabel`), shown only when the menu also ends in
 * the "Request & approval" group, so the entry's own actions and the request's read as two titled groups.
 */
export function RequestableStandardMenuLabel({entry, collection}: Omit<MenuProps, "onAction">) {
    const {resolveLanguageKey} = useDynamicLanguage(LANGUAGE_PATH);
    if (useOfferedDecisions(entry, collection).length === 0) return null;
    return <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">{resolveLanguageKey("entryActions")}</DropdownMenuLabel>;
}

/**
 * The decisions on a requested entry, as menu items: approve and reject inside the platform company (the server refuses
 * them anywhere else), withdraw for the company that requested it. Each also needs its action permission.
 */
export function RequestableEntryMenu({entry, collection, onAction}: MenuProps) {
    const {resolveLanguageKey} = useDynamicLanguage(LANGUAGE_PATH);
    const offered = useOfferedDecisions(entry, collection);
    const icons = {approve: IconCircleCheck, reject: IconCircleX, withdraw: IconArrowBackUp};
    const tones = {approve: "text-success", reject: "text-destructive", withdraw: "text-muted-foreground"};

    if (offered.length === 0) return null;
    // Last in the menu, under its own heading: the request's workflow, not the entry's data (`afterStandardMenuChildren`).
    return (
        <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">{resolveLanguageKey("requestApproval")}</DropdownMenuLabel>
            {offered.map((decision) => {
                const Icon = icons[decision];
                return (
                    <DropdownMenuItem key={decision} onClick={() => onAction(decision)}>
                        <Icon className={tones[decision]} size={16} />
                        <p>{resolveLanguageKey(decision)}</p>
                    </DropdownMenuItem>
                );
            })}
        </>
    );
}

/** The request status on a card or sheet header: requested, rejected or withdrawn; nothing on an approved entry. */
export function RequestStatusBadge({entry, collection}: {entry: RequestableEntry; collection: string}) {
    const {resolveLanguageKey} = useDynamicLanguage(LANGUAGE_PATH);
    const status = entry.requestStatus;
    if (!status || status === "approved") return null;
    return <StatusBadge tableConfigKey={collection} field="requestStatus" value={status} label={String(resolveLanguageKey(`requestStatusValues.${status}`))} />;
}

/**
 * The request at the bottom of a card, under a rule (rendered by `EntityCard`): one line with its status, and an info button that opens the
 * record (who asked, when, the decision) as info rows in a popover, so cards stay slim. Shown only on entries that were
 * requested; the server sends the record only to the requesting company and the platform.
 */
export function RequestFooter({entry, collection}: {entry: RequestableEntry; collection: string}) {
    const {resolveLanguageKey} = useDynamicLanguage(LANGUAGE_PATH);
    if (!entry.requestedAt || !entry.requestStatus) return null;
    const label = (key: string) => String(resolveLanguageKey(key));
    return (
        <div className="mt-auto flex min-w-0 items-center gap-2 border-t border-border/60 pt-(--density-pad)">
            <span className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground" title={label("requestStatus")}>
                <span className="truncate font-medium">{label("requestApproval")}</span>
                <StatusBadge tableConfigKey={collection} field="requestStatus" value={entry.requestStatus} label={label(`requestStatusValues.${entry.requestStatus}`)} />
            </span>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="bare"
                        type="button"
                        aria-label={label("requestDetails")}
                        title={label("requestDetails")}
                        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <IconInfoCircle size={16} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80" onClick={(e) => e.stopPropagation()}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label("requestApproval")}</p>
                    <InfoRowGroup>
                        <EntityCardRow icon={IconCircleDot} label={label("requestStatus")} tooltip={label("requestStatus")} path="requestStatus" value={entry.requestStatus}>
                            {() => <StatusBadge tableConfigKey={collection} field="requestStatus" value={entry.requestStatus} label={label(`requestStatusValues.${entry.requestStatus}`)} />}
                        </EntityCardRow>
                        {entry.requestedByCompanyName ? (
                            <EntityCardRow icon={IconBuilding} label={label("requestedByCompanyName")} tooltip={label("requestedByCompanyName")} path="requestedByCompanyName" value={entry.requestedByCompanyName} />
                        ) : null}
                        <EntityCardRow icon={IconCalendar} label={label("requestedAt")} tooltip={label("requestedAt")} path="requestedAt" type="dateTime" value={entry.requestedAt} />
                        {entry.decidedAt ? (
                            <EntityCardRow icon={IconCalendarCheck} label={label("decidedAt")} tooltip={label("decidedAt")} path="decidedAt" type="dateTime" value={entry.decidedAt} />
                        ) : null}
                        {entry.decisionNotes ? (
                            <EntityCardRow icon={IconNotes} label={label("decisionNotes")} tooltip={label("decisionNotes")} path="decisionNotes" value={entry.decisionNotes} />
                        ) : null}
                    </InfoRowGroup>
                </PopoverContent>
            </Popover>
        </div>
    );
}

/** The list's "Request status" quick filter, for the platform company (other companies see only their own requests). */
export function useRequestStatusQuickFilter(enabled: boolean): QuickFilterDef[] {
    const {resolveLanguageKey} = useDynamicLanguage(LANGUAGE_PATH);
    return useMemo<QuickFilterDef[]>(() => (enabled ? [{
        field: "requestStatus",
        label: String(resolveLanguageKey("requestStatus")),
        type: COLUMN_TYPE.ENUM,
        enumValues: REQUEST_STATUS_VALUES.map((value) => ({value, label: String(resolveLanguageKey(`requestStatusValues.${value}`))})),
    }] : []), [enabled, resolveLanguageKey]);
}

/**
 * The list header's "Request an entry" button, in place of Create, for a company that may not create on a requestable
 * platform list but holds its `request` permission: it opens the list's own create page, which then sends a request.
 */
export function RequestEntryButton({path}: {path: string}) {
    const navigate = useNavigate();
    const {resolveLanguageKey} = useDynamicLanguage(LANGUAGE_PATH);
    return (
        <Button
            type="button"
            variant="outline"
            title={String(resolveLanguageKey("managedByPlatform"))}
            onClick={(e) => { navigate(path); e.stopPropagation(); e.preventDefault(); }}
        >
            <IconSend />
            <ButtonTitle>{resolveLanguageKey("requestEntry")}</ButtonTitle>
        </Button>
    );
}
