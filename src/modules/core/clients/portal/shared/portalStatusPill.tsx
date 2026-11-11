import {cn} from "@coreModule/components/lib/utils.ts";

/** Pill colours by status word, shared by every portal section; an unknown word is neutral. */
const TONES: Record<string, string> = {
    pending: "bg-amber-50 text-amber-800 ring-amber-200",
    unpaid: "bg-amber-50 text-amber-800 ring-amber-200",
    revision_requested: "bg-amber-50 text-amber-800 ring-amber-200",
    authorized: "bg-sky-50 text-sky-800 ring-sky-200",
    confirmed: "bg-sky-50 text-sky-800 ring-sky-200",
    processing: "bg-sky-50 text-sky-800 ring-sky-200",
    open: "bg-sky-50 text-sky-800 ring-sky-200",
    submitted: "bg-sky-50 text-sky-800 ring-sky-200",
    shipped: "bg-indigo-50 text-indigo-800 ring-indigo-200",
    partially_fulfilled: "bg-indigo-50 text-indigo-800 ring-indigo-200",
    in_progress: "bg-indigo-50 text-indigo-800 ring-indigo-200",
    paid: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    delivered: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    fulfilled: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    accepted: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    awarded: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    completed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    released: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    cancelled: "bg-red-50 text-red-700 ring-red-200",
    voided: "bg-red-50 text-red-700 ring-red-200",
    rejected: "bg-red-50 text-red-700 ring-red-200",
    closed: "bg-muted text-muted-foreground ring-border",
};

/** A status on the portal's own pages: coloured by its word, labelled in the caller's words. */
export function PortalStatusPill({value, label}: {value: string; label: string}) {
    return (
        <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", TONES[value] ?? "bg-muted text-muted-foreground ring-border")}>
            {label}
        </span>
    );
}
