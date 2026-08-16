import {compose} from "redux";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";
import {CheckCheck, FileText, Globe, Mail, Phone} from "lucide-react";
import "leaflet/dist/leaflet.css";
import {RefObject, useCallback, useRef, useState, lazy, memo, Suspense} from "react";
import {useReactToPrint} from "react-to-print";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Collapsible, CollapsibleContent} from "@coreModule/components/ui/collapsible.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {accessFieldPathExists} from "@coreModule/helpers/hocs/withAccess.tsx";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {ImageDown, Maximize2, Minimize2} from "lucide-react";
import ActivateCompany from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/activate.tsx";
import DeactivateCompany from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/deactivate.tsx";
import ActivateCompanyDialog from "@coreModule/components/custom/company/activateCompanyDialog.tsx";
import DeactivateCompanyDialog from "@coreModule/components/custom/company/deactivateCompanyDialog.tsx";
import CompanySheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/sheetView/companySheetView.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@coreModule/components/ui/popover.tsx";
import ExpandableText from "@coreModule/components/custom/expandableText.tsx";
import {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";
import DisplayRow from "@coreModule/components/custom/displayValue/displayRow.tsx";
import EntityCard from "@coreModule/components/custom/systemCards/entityCard.tsx";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";
import {openActionMenuFromContextMenu} from "@coreModule/components/custom/actions/menu/openActionMenuFromContextMenu.ts";

const CompanyMap = lazy(() => import("@coreModule/components/custom/addresses/mapWithMultiplePins.tsx"));

function companyEditPath(c: Company) {
    const params = new URLSearchParams();
    params.set("companyId", c._id);
    if (c.name) params.set("companyName", c.name);
    return `/tenancy/systemSettings/companies/edit?${params.toString()}`;
}

const numberOfVisibleDomains = 2;

type CompanyCardProps = WithLanguageType & {
    company: Company;
    single?: boolean;
    overrideCompanyId?: string;
    listRef?: RefObject<{ refetch: () => void; updateRow: (id: string | number, patch: Partial<Company>) => void } | null>;
    hideActions?: boolean;
    hideEdit?: boolean;
    fetchId?: string;
    sheetOnly?: boolean;
    innerRef?: RefObject<WithAxiosLifecycleRef<Company> | null>;
};

const CompanyCard = memo(function CompanyCard({
    company,
    resolveLanguageKey,
    single,
    listRef,
    hideActions,
    hideEdit = false,
    fetchId,
    sheetOnly = false,
    innerRef,
}: CompanyCardProps) {
    const [expanded, setExpanded] = useState(!!single);
    const contentRef = useRef<HTMLDivElement>(null);
    const companyInfoRef = useRef<HTMLDivElement>(null);

    const setPageSize = useCallback((): Promise<void> => {
        return new Promise((resolve) => {
            if (!contentRef.current || !companyInfoRef.current) return resolve();
            const companyInfoWidth = companyInfoRef.current.getBoundingClientRect().width;
            companyInfoRef.current.classList.remove("print:grid-cols-1", "print:grid-cols-2");
            companyInfoRef.current.classList.add(companyInfoWidth < 640 ? "print:grid-cols-1" : "print:grid-cols-2");
            const {width, height} = contentRef.current.getBoundingClientRect();
            const pxToMm = (px: number) => (px * 25.4) / 96;
            const style = document.createElement("style");
            style.id = "dynamic-print-style";
            style.innerHTML = `@media print { @page { width: ${pxToMm(width).toFixed(2)}mm; height: ${pxToMm(height).toFixed(2)}mm; margin: 0; } body { margin: 0; } }`;
            document.head.appendChild(style);
            resolve();
        });
    }, []);

    const removeDynamicPrintStyle = useCallback(() => {
        document.getElementById("dynamic-print-style")?.remove();
    }, []);

    const reactToPrintFn = useReactToPrint({
        contentRef,
        onBeforePrint: setPageSize,
        onAfterPrint: removeDynamicPrintStyle,
    });

    return (
        <div
            ref={contentRef}
            id={"company_" + company._id}
            onContextMenu={openActionMenuFromContextMenu}
        >
            <EntityCard
                resource="companies"
                entity={company}
                fetchId={fetchId}
                onDelete={undefined}
                hideActions={hideActions}
                hideDelete
                hideRestore
                hideEdit={hideEdit}
                sheetOnly={sheetOnly}
                editPath={companyEditPath}
                Sheet={CompanySheetView}
                sheetEntityProp="company"
                deleteUrl="/api/company"
                restoreUrl=""
                failedTitle=""
                failedDescription=""
                titlePath="name"
                innerRef={innerRef}
                shellClassName={(row) =>
                    cn(
                        "relative overflow-hidden border-l max-w-6xl",
                        !row.isActive ? "border-l-destructive" : "border-l-green-700",
                    )
                }
                sheetProps={({entity: row}) => ({
                    hideEdit,
                    onActivateSuccess: () => listRef?.current?.updateRow?.(row._id, {isActive: true}),
                    onDeactivateSuccess: () => listRef?.current?.updateRow?.(row._id, {isActive: false}),
                })}
                extraDialogs={({action, setAction, entity: row, setEntity}) => (
                    <>
                        {action === "activateCompany" && (
                            <ActivateCompanyDialog
                                open
                                onOpenChange={(next: boolean) => {
                                    if (!next) setAction("");
                                }}
                                company={row}
                                onSuccess={() => {
                                    setEntity({...row, isActive: true});
                                    listRef?.current?.updateRow?.(row._id, {isActive: true});
                                }}
                            />
                        )}
                        {action === "deactivateCompany" && (
                            <DeactivateCompanyDialog
                                open
                                onOpenChange={(next: boolean) => {
                                    if (!next) setAction("");
                                }}
                                company={row}
                                onSuccess={() => {
                                    setEntity({...row, isActive: false});
                                    listRef?.current?.updateRow?.(row._id, {isActive: false});
                                }}
                            />
                        )}
                    </>
                )}
            >
                {({entity: row, read, setAction}) => {
                    const logoTile = accessFieldPathExists(read, "logo") ? (
                        <Avatar className="h-12 w-12 shrink-0 border-2 border-background shadow-md">
                            {row.logo ? (
                                <AvatarImage src={`/api/auxiliary/media/${row.logo}`} alt={row.name} />
                            ) : null}
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                {row.name.substring(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                    ) : undefined;

                    return (
                        <>
                            {accessFieldPathExists(read, "isActive") && (
                                <TooltipDisplayer tooltip={resolveLanguageKey(row.isActive ? "active" : "notActive")}>
                                    <div
                                        className={cn(
                                            "absolute top-0 left-0 h-full w-1 shrink-0",
                                            !row.isActive ? "bg-destructive" : "bg-success",
                                        )}
                                    />
                                </TooltipDisplayer>
                            )}
                            <EntityCard.Header titlePath="name" title={row.name} icon={logoTile}>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        reactToPrintFn();
                                    }}
                                >
                                    <ImageDown size={16} />
                                    {resolveLanguageKey("downloadCard")}
                                </DropdownMenuItem>
                                {!single && accessFieldPathExists(read, "description") && !!row.description && (
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setExpanded((prev) => !prev);
                                        }}
                                    >
                                        {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                        {resolveLanguageKey(expanded ? "collapse" : "expand")}
                                    </DropdownMenuItem>
                                )}
                                <ActivateCompany company={row} onAction={setAction} />
                                <DeactivateCompany company={row} onAction={setAction} />
                            </EntityCard.Header>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" ref={companyInfoRef}>
                                <EntityCard.Body className="flex-col flex-nowrap gap-4">
                                    <DisplayRow
                                        icon={Mail}
                                        tooltip={resolveLanguageKey("email")}
                                        label={resolveLanguageKey("email")}
                                        path="email"
                                        value={row.email}
                                    >
                                        {(formatted) =>
                                            row.email ? (
                                                <a className="hover:underline" href={`mailto:${row.email}`}>
                                                    {formatted}
                                                </a>
                                            ) : formatted
                                        }
                                    </DisplayRow>
                                    <DisplayRow
                                        icon={Phone}
                                        tooltip={resolveLanguageKey("phone")}
                                        label={resolveLanguageKey("phone")}
                                        path="phoneNumber"
                                        value={row.phoneNumber}
                                    >
                                        {(formatted) =>
                                            row.phoneNumber ? (
                                                <a className="hover:underline" href={`tel:${row.phoneNumber}`}>
                                                    {formatted}
                                                </a>
                                            ) : formatted
                                        }
                                    </DisplayRow>
                                    <DisplayRow
                                        icon={FileText}
                                        tooltip={resolveLanguageKey("vat")}
                                        label={resolveLanguageKey("vat")}
                                        path="vat"
                                        value={row.vat}
                                    />
                                    <DisplayRow
                                        icon={Globe}
                                        tooltip={resolveLanguageKey("website")}
                                        label={resolveLanguageKey("website")}
                                        path="website"
                                        value={row.website}
                                    >
                                        {(formatted) =>
                                            row.website ? (
                                                <a className="hover:underline" target="_blank" href={`${row.website}`}>
                                                    {formatted}
                                                </a>
                                            ) : formatted
                                        }
                                    </DisplayRow>
                                    {expanded ? (
                                        <DisplayRow
                                            icon={CheckCheck}
                                            tooltip={resolveLanguageKey("allowedDomains")}
                                            label={resolveLanguageKey("allowedDomains")}
                                            path="allowedDomains"
                                            value={row.allowedDomains}
                                        >
                                            {() =>
                                                row.allowedDomains && row.allowedDomains.length > 0 ? (
                                                    <div className="flex flex-wrap items-center gap-1">
                                                        {row.allowedDomains.slice(0, numberOfVisibleDomains).map((domain, index) => (
                                                            <Badge
                                                                key={"allowed_domain_" + index}
                                                                variant="outline"
                                                                className="text-muted-foreground"
                                                            >
                                                                {domain === "*" ? (
                                                                    <a className="hover:underline" href="#">
                                                                        {domain}
                                                                    </a>
                                                                ) : (
                                                                    <a className="hover:underline" target="_blank" href={`${domain}`}>
                                                                        {domain}
                                                                    </a>
                                                                )}
                                                            </Badge>
                                                        ))}
                                                        {row.allowedDomains.length > numberOfVisibleDomains && (
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <button
                                                                        type="button"
                                                                        className="inline-flex"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="cursor-pointer text-muted-foreground hover:bg-muted"
                                                                        >
                                                                            +
                                                                            {row.allowedDomains.length - numberOfVisibleDomains}
                                                                        </Badge>
                                                                    </button>
                                                                </PopoverTrigger>
                                                                <PopoverContent
                                                                    align="start"
                                                                    className="w-fit"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <div className="flex flex-col flex-wrap gap-1.5">
                                                                        {row.allowedDomains.slice(numberOfVisibleDomains).map((domain, index) => (
                                                                            <Badge
                                                                                key={"remaining_allowed_domain_" + index}
                                                                                variant="outline"
                                                                                className="text-muted-foreground"
                                                                            >
                                                                                {domain === "*" ? (
                                                                                    <a className="hover:underline" href="#">
                                                                                        {domain}
                                                                                    </a>
                                                                                ) : (
                                                                                    <a className="hover:underline" target="_blank" href={`${domain}`}>
                                                                                        {domain}
                                                                                    </a>
                                                                                )}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <></>
                                                )
                                            }
                                        </DisplayRow>
                                    ) : null}
                                </EntityCard.Body>
                                <HiddenElement>
                                    {accessFieldPathExists(read, "addresses") &&
                                        !!row.addresses &&
                                        row.addresses.filter((a) => a?.longitude && a?.latitude).length > 0 && (
                                            <div className="h-full min-h-32 w-full" onClick={(e) => e.stopPropagation()}>
                                                <Suspense fallback={<div className="w-full animate-pulse rounded-md border bg-muted" />}>
                                                    <CompanyMap
                                                        openInGoogleMaps={resolveLanguageKey("openInGoogleMaps")}
                                                        openInAppleMaps={resolveLanguageKey("openInAppleMaps")}
                                                        addresses={row.addresses}
                                                    />
                                                </Suspense>
                                            </div>
                                        )}
                                </HiddenElement>
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                                <Collapsible open={expanded} onOpenChange={setExpanded}>
                                    <CollapsibleContent>
                                        <HiddenElement>
                                            {accessFieldPathExists(read, "description") && row.description ? (
                                                <ExpandableText maxLength={800}>{row.description}</ExpandableText>
                                            ) : null}
                                        </HiddenElement>
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>
                        </>
                    );
                }}
            </EntityCard>
        </div>
    );
});

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/companies/center/cardView/companyCard.tsx"),
    withDebug(true, true)
)(CompanyCard);
