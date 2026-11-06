import {IconBuildingStore} from "@tabler/icons-react";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {usePortalListedCompany} from "./portalListedCompany.tsx";

function initials(name: string) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

const KIND_LABEL = {
    vehicleCategory: "rentedBy",
    treatment: "offeredBy",
    project: "listedBy",
    unit: "listedBy",
} as const;

type PortalProviderCardProps = WithLanguageType & {
    kind: keyof typeof KIND_LABEL;
    className?: string;
};

/**
 * Who provides the item: logo, name, and on the apex a link to that company's own site.
 * On a company's host the visit link stays off — the visitor is already there.
 */
function PortalProviderCard({kind, className, resolveLanguageKey}: PortalProviderCardProps) {
    const company = usePortalListedCompany();
    if (!company) return null;

    const label = resolveLanguageKey(KIND_LABEL[kind]);
    const visitLabel = resolveLanguageKey("visitSiteNamed").replace("{name}", company.name);
    const mark = company.logo ? (
        <span className="inline-flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card ring-1 ring-border">
            <img src={company.logo} alt="" className="size-full object-contain p-0.5" />
        </span>
    ) : (
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground font-display text-sm font-semibold text-background" aria-hidden>
            {initials(company.name) || "·"}
        </span>
    );

    const identity = (
        <>
            {mark}
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
                <p className={cn("font-display truncate text-base font-semibold tracking-tight", company.visitHref && "underline-offset-2 group-hover/provider:underline")}>
                    {company.name}
                </p>
            </div>
        </>
    );

    return (
        <div className={cn("flex items-center gap-3 rounded-2xl border border-border bg-muted/60 px-4 py-3", className)}>
            {company.visitHref ? (
                <a href={company.visitHref} aria-label={visitLabel} className="group/provider flex min-w-0 flex-1 items-center gap-3">
                    {identity}
                </a>
            ) : (
                <div className="flex min-w-0 flex-1 items-center gap-3">{identity}</div>
            )}
            {company.visitHref ? (
                <a
                    href={company.visitHref}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-foreground"
                >
                    <IconBuildingStore className="size-3.5" aria-hidden />
                    {resolveLanguageKey("visitSite")}
                </a>
            ) : null}
        </div>
    );
}

export default compose(withLanguage("src/modules/core/clients/portal/shared/portalProviderCard.tsx"))(PortalProviderCard);
