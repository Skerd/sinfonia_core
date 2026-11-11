import {Badge} from "@coreModule/components/ui/badge.tsx";

type Props = {
    /** The person or thing the record is about ("Besa Leka"). Empty falls back to the code alone. */
    name: string;
    /** The record's number ("AP-20261110-…"), shown small beside the name. */
    code?: string;
    /** What kind of record this is ("Appointment"), the badge every sheet shows under its title. */
    typeLabel: string;
};

/**
 * A sheet title that names the record the way people say it, with its code as a badge (UX-01). Passed to
 * `SheetViewRenderer` `headerTitle` when the name is computed (first + last name), which `header.titleField` can't do.
 */
export default function SheetNameTitle({name, code, typeLabel}: Props) {
    return (
        <span className="flex min-w-0 flex-col justify-center gap-1">
            <span className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="min-w-0 max-w-full truncate md:text-xl">{name || code}</span>
                {name && code ? (
                    <Badge variant="outline" className="font-mono text-xs font-normal">
                        {code}
                    </Badge>
                ) : null}
            </span>
            <Badge variant="secondary" className="w-fit">
                {typeLabel}
            </Badge>
        </span>
    );
}
