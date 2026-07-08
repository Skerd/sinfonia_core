import {compose} from "redux";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Card, CardContent, CardHeader} from "@coreModule/components/ui/card.tsx";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";
import {CheckCheck, FileText, Globe, Mail, Phone} from "lucide-react";
import "leaflet/dist/leaflet.css";
import {RefObject, useCallback, useRef, useState} from "react";
import {useReactToPrint} from "react-to-print";
import {lazy, memo, Suspense} from "react";
import {cn} from "@coreModule/components/lib/utils.ts";
import {Collapsible, CollapsibleContent} from "@coreModule/components/ui/collapsible.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import ActionMenu from "@coreModule/components/custom/actions/menu/actionMenu.tsx";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {ImageDown, Maximize2, Minimize2} from "lucide-react";
import ActivateCompany from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/activate.tsx";
import DeactivateCompany from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/actions/deactivate.tsx";
import ActivateCompanyDialog from "@coreModule/components/custom/company/activateCompanyDialog.tsx";
import DeactivateCompanyDialog from "@coreModule/components/custom/company/deactivateCompanyDialog.tsx";
import CompanySheetView from "@coreModule/clients/panel/private/tenancy/systemSettings/companies/center/sheetView/companySheetView.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import InfoRow from "@coreModule/components/custom/infoRow.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@coreModule/components/ui/popover.tsx";
import ExpandableText from "@coreModule/components/custom/expandableText.tsx";
import {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";

const CompanyMap = lazy(() => import("@coreModule/components/custom/addresses/mapWithMultiplePins.tsx"));

const emptyDeleted: DeletedData = {};

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
};

const CompanyCard = memo(function CompanyCard({
    company,
    resolveLanguageKey,
    single,
    listRef,
    hideActions,
    hideEdit = false,
}: CompanyCardProps) {
    const {read = {}} = useAccess("companies") || {};

    const [action, setAction] = useState("");
    const [open, setOpen] = useState(single);

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

    if (!read || !Object.keys(read).length) return <HiddenElement />;

    return (
        <>
            <Card
                id={"company_" + company._id}
                ref={contentRef}
                className={cn(
                    "relative h-fit group overflow-hidden transition-colors hover:bg-muted/40 has-data-[state=open]:bg-muted/40 border-l max-w-6xl hover:cursor-pointer",
                    !company.isActive ? "border-l-destructive" : "border-l-green-700"
                )}
                onClick={() => setAction("view")}
            >
                {
                    read?.isActive &&
                    <TooltipDisplayer tooltip={resolveLanguageKey(company.isActive ? "active": "notActive")}>
                        <div className={cn("absolute top-0 left-0 h-full w-1 shrink-0", !company.isActive ? "bg-destructive" : "bg-green-700")} />
                    </TooltipDisplayer>
                }
                <CardHeader className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <HiddenElement>
                            {
                                !!read?.logo &&
                                <>
                                    {
                                        !!company.logo ?
                                        <Avatar className="w-12 h-12 border-2 border-background shadow-md shrink-0">
                                            <AvatarImage src={`/api/auxiliary/media/${company.logo}`} alt={company.name} />
                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                                {company.name.substring(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        :
                                        <>
                                            <Avatar className="w-12 h-12 border-2 border-background shadow-md shrink-0">
                                                <AvatarFallback className="bg-primary text-primary-foreground">
                                                    {company.name.substring(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </>
                                    }
                                </>
                            }
                        </HiddenElement>
                        <HiddenElement>
                            {
                                read?.name &&
                                <div className="flex flex-col justify-center min-w-0">
                                    <div className="font-semibold text-base leading-tight truncate">{company.name}</div>
                                </div>
                            }
                        </HiddenElement>
                    </div>
                    {!hideActions && (
                        <div onClick={(e) => e.stopPropagation()}>
                            <ActionMenu
                                accessModel="companies"
                                deletedData={emptyDeleted}
                                editPath={companyEditPath(company)}
                                onAction={(a: string) => setAction(a)}
                                allowMenuForCustomChildren
                                hideDelete
                                hideEdit={hideEdit}
                            >
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
                                {!single && read?.description && !!company.description && (
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setOpen(!open);
                                        }}
                                    >
                                        {open ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                        {resolveLanguageKey(open ? "collapse" : "expand")}
                                    </DropdownMenuItem>
                                )}
                                <ActivateCompany company={company} onAction={(a: string) => setAction(a)} />
                                <DeactivateCompany company={company} onAction={(a: string) => setAction(a)} />
                            </ActionMenu>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-3 text-sm flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" ref={companyInfoRef}>
                        <div className="space-y-4">
                            <InfoRow
                                icon={Mail}
                                tooltip={resolveLanguageKey("email")}
                                label={resolveLanguageKey("email")}
                                show={read?.email}
                                value={company.email ? <a className="hover:underline" href={`mailto:${company.email}`}>{company.email}</a> : undefined}
                            />

                            <InfoRow
                                icon={Phone}
                                tooltip={resolveLanguageKey("phone")}
                                label={resolveLanguageKey("phone")}
                                show={read?.phoneNumber}
                                value={company.email ? <a className="hover:underline" href={`tel:${company.phoneNumber}`}>{company.phoneNumber}</a> : undefined}
                            />

                            <InfoRow
                                icon={FileText}
                                tooltip={resolveLanguageKey("vat")}
                                label={resolveLanguageKey("vat")}
                                show={read?.vat}
                                value={company.vat}
                            />

                            <InfoRow
                                icon={Globe}
                                tooltip={resolveLanguageKey("website")}
                                label={resolveLanguageKey("website")}
                                show={read?.website}
                                value={company.website ? <a className="hover:underline" target={"_blank"} href={`${company.website}`}>{company.website}</a> : undefined}
                            />

                            {
                                open &&
                                <InfoRow
                                    icon={CheckCheck}
                                    tooltip={resolveLanguageKey("allowedDomains")}
                                    label={resolveLanguageKey("allowedDomains")}
                                    show={read?.allowedDomains}
                                    value={
                                        company.allowedDomains && company.allowedDomains.length > 0 ?
                                            <div className="space-x-1 flex items-center space-y-1 flex-wrap">
                                                {
                                                    company.allowedDomains.slice(0, numberOfVisibleDomains).map((domain, index) => {
                                                        if( domain === "*" ){
                                                            return (
                                                                <Badge key={"allowed_domain_" + index} variant="outline" className="text-muted-foreground">
                                                                    <a className="hover:underline" href={`#`}>{domain}</a>
                                                                </Badge>
                                                            )
                                                        }
                                                        return (
                                                            <Badge key={"allowed_domain_" + index} variant="outline" className="text-muted-foreground">
                                                                <a className="hover:underline" target={"_blank"} href={`${domain}`}>{domain}</a>
                                                            </Badge>
                                                        )
                                                    })
                                                }
                                                {
                                                    company.allowedDomains.length > numberOfVisibleDomains && (
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <button
                                                                    type="button"
                                                                    className="inline-flex"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <Badge variant="outline" className="text-muted-foreground cursor-pointer hover:bg-muted">
                                                                        +{company.allowedDomains.length - numberOfVisibleDomains}
                                                                    </Badge>
                                                                </button>
                                                            </PopoverTrigger>
                                                            <PopoverContent
                                                                align="start"
                                                                className="w-fit"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <div className="flex flex-col flex-wrap gap-1.5">
                                                                    {
                                                                        company.allowedDomains.slice(numberOfVisibleDomains).map((domain, index) => {
                                                                            if (domain === "*") {
                                                                                return (
                                                                                    <Badge key={"remaining_allowed_domain_" + index} variant="outline" className="text-muted-foreground">
                                                                                        <a className="hover:underline" href={`#`}>{domain}</a>
                                                                                    </Badge>
                                                                                );
                                                                            }
                                                                            return (
                                                                                <Badge key={"remaining_allowed_domain_" + index} variant="outline" className="text-muted-foreground">
                                                                                    <a className="hover:underline" target={"_blank"} href={`${domain}`}>{domain}</a>
                                                                                </Badge>
                                                                            );
                                                                        })
                                                                    }
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    )
                                                }
                                            </div>
                                            :
                                            <></>
                                    }
                                />
                            }
                        </div>
                        <HiddenElement>
                            {
                                read?.addresses &&
                                <>
                                    {
                                        !!company.addresses && company.addresses.filter((a) => a?.longitude && a?.latitude).length > 0 && (
                                            <div className="w-full h-full min-h-32" onClick={(e) => e.stopPropagation()}>
                                                <Suspense fallback={<div className="w-full rounded-md border animate-pulse bg-muted" />}>
                                                    <CompanyMap
                                                        openInGoogleMaps={resolveLanguageKey("openInGoogleMaps")}
                                                        openInAppleMaps={resolveLanguageKey("openInAppleMaps")}
                                                        addresses={company.addresses}
                                                    />
                                                </Suspense>
                                            </div>
                                        )
                                    }
                                </>
                            }
                        </HiddenElement>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                        <Collapsible open={open} onOpenChange={setOpen}>
                            <CollapsibleContent>
                                <HiddenElement>
                                    {
                                        read?.description &&
                                        <>
                                            {
                                                company.description &&
                                                <ExpandableText maxLength={800}>{company.description}</ExpandableText>
                                            }
                                        </>
                                    }
                                </HiddenElement>
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                </CardContent>
            </Card>

            {action === "view" && (
                <CompanySheetView
                    open={action === "view"}
                    onOpenChange={() => {setAction("");}}
                    company={company}
                    hideEdit={hideEdit}
                    onActivateSuccess={() => listRef?.current?.updateRow?.(company._id, {isActive: true})}
                    onDeactivateSuccess={() => listRef?.current?.updateRow?.(company._id, {isActive: false})}
                />
            )}

            {action === "activateCompany" && (
                <ActivateCompanyDialog
                    open={action === "activateCompany"}
                    onOpenChange={(open: boolean) => { if (!open) setAction(""); }}
                    company={company}
                    onSuccess={() => listRef?.current?.updateRow?.(company._id, {isActive: true})}
                />
            )}
            {action === "deactivateCompany" && (
                <DeactivateCompanyDialog
                    open={action === "deactivateCompany"}
                    onOpenChange={(open: boolean) => { if (!open) setAction(""); }}
                    company={company}
                    onSuccess={() => listRef?.current?.updateRow?.(company._id, {isActive: false})}
                />
            )}
        </>
    );
});

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/companies/center/cardView/companyCard.tsx"),
    withDebug(true, true)
)(CompanyCard);
