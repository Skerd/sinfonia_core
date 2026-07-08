import {
    createElement,
    isValidElement,
    type ComponentType,
} from "react";
import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import SmallInfoCard from "@coreModule/components/custom/smallInfoCard.tsx";
import type { SmallInfoCardLinkedSheetOuterProps } from "@coreModule/components/custom/smallInfoCard.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import SheetLocationMap from "@coreModule/components/custom/addresses/sheetLocationMap.tsx";
import { resolveWidget, resolveIcon } from "./widgetRegistry.ts";
import { cn } from "@coreModule/components/lib/utils.ts";
import {SheetGrid} from "@coreModule/components/custom/renderEngine/layout/sheet/grid.tsx";
import {Card, CardContent} from "@coreModule/components/ui/card.tsx";

function resolvePath(obj: Record<string, any>, path: string): any {
    return path.split(".").reduce<any>((acc, key) => acc?.[key], obj);
}

function normalizeObjectIdRef<T extends { _id: string }>(
    raw: unknown,
): { stub: T; fetchId: string | undefined } | null {
    if (raw == null || raw === "") return null;
    if (typeof raw === "string") {
        return { stub: {_id: raw} as T, fetchId: raw };
    }
    if (typeof raw === "object") {
        const _id = (raw as {_id?: unknown})._id;
        if (typeof _id === "string") {
            return { stub: raw as T, fetchId: _id };
        }
        return { stub: raw as T, fetchId: undefined };
    }
    return null;
}

function bootstrapLinkedSheetDataFromDisplayValue(
    linkedId: string,
    displayValue: unknown,
    valueFieldName: string | undefined,
): Record<string, unknown> {
    const field =
        typeof valueFieldName === "string" && valueFieldName.length > 0 ? valueFieldName : "name";
    const base: Record<string, unknown> = { _id: linkedId };
    if (displayValue == null || isValidElement(displayValue)) {
        return base;
    }
    if (
        typeof displayValue === "string" ||
        typeof displayValue === "number" ||
        typeof displayValue === "boolean"
    ) {
        base[field] = String(displayValue);
        return base;
    }
    return base;
}

function bootstrapLinkedSmallInfoSheetData(
    linkedId: string,
    rawRefAtPath: unknown,
    displayValue: unknown,
    valueFieldName: string | undefined,
): Record<string, unknown> {
    const normalized = normalizeObjectIdRef(rawRefAtPath);
    const stub = normalized?.stub;
    if (
        stub &&
        typeof stub === "object" &&
        !Array.isArray(stub) &&
        Object.keys(stub as object).length > 1
    ) {
        return { ...(stub as Record<string, unknown>) };
    }
    return bootstrapLinkedSheetDataFromDisplayValue(linkedId, displayValue, valueFieldName);
}

function buildLinkedReferenceSheet(
    scopedData: Record<string, any>,
    linkedPath: string,
    linkedModel: string,
    linkedWidgetToken: string,
    entityProp: string,
    displayValue: unknown,
    badgeAccessResourceId: string,
):
    | {
          resourceId: string;
          badgeAccessResourceId?: string;
          LinkedSheet: ComponentType<SmallInfoCardLinkedSheetOuterProps>;
      }
    | undefined {
    const LinkedSheetWidget = resolveWidget(linkedWidgetToken);
    if (!LinkedSheetWidget) return undefined;
    const raw = resolvePath(scopedData, linkedPath);
    const normalized = normalizeObjectIdRef(raw);
    const id =
        normalized?.stub && typeof (normalized.stub as { _id?: unknown })._id === "string"
            ? (normalized.stub as { _id: string })._id
            : undefined;
    if (!id) return undefined;
    const bootstrap = bootstrapLinkedSmallInfoSheetData(id, raw, displayValue, undefined);
    const BoundLinkedSheet: ComponentType<SmallInfoCardLinkedSheetOuterProps> = (sheetProps) => {
        const { onLinkedDeleted, ...rest } = sheetProps;
        const sheetPropsOut: Record<string, unknown> = {
            ...rest,
            fetchId: id,
            onDelete: () => {
                onLinkedDeleted?.();
            },
        };
        sheetPropsOut[entityProp] = bootstrap;
        return createElement(LinkedSheetWidget as ComponentType<any>, sheetPropsOut);
    };
    return {
        resourceId: linkedModel,
        badgeAccessResourceId,
        LinkedSheet: BoundLinkedSheet,
    };
}

const DEFAULT_BADGE_ACCESS_MODEL = "companies";

function normalizeAddressRows(input: unknown): any[] {
    if (input == null || input === "") return [];
    if (Array.isArray(input)) {
        return input.filter((x) => x != null && typeof x === "object");
    }
    if (typeof input === "object") {
        return [input];
    }
    return [];
}

export type SheetCompanyAddressesSectionProps = {
    addresses: unknown;
    resolveLanguageKey: ResolveLanguageKey;
    show?: boolean;
    /** Access model id for linked ref badges (e.g. `edifices` on edifice sheet). Defaults to `companies`. */
    badgeAccessModel?: string;
};

/**
 * Renders each `addresses[]` entry — or a single embedded `address` object — with a shared grid + optional map layout.
 */
export default function SheetCompanyAddressesSection({
    addresses,
    resolveLanguageKey,
    show = true,
    badgeAccessModel = DEFAULT_BADGE_ACCESS_MODEL,
}: SheetCompanyAddressesSectionProps) {
    const rows = normalizeAddressRows(addresses);
    if (rows.length === 0) {
        return (
            <div className="mt-0.5">
                <ValueNotSet />
            </div>
        );
    }

    const multipleAddresses = rows.length > 1;

    return (
        <div className={multipleAddresses ? "space-y-3" : "space-y-4"}>
            {rows.map((row: any, idx: number) => {
                const scoped: Record<string, any> = { address: row };
                const countryName = resolvePath(scoped, "address.country.name");
                const stateName = resolvePath(scoped, "address.state.name");
                const cityName = resolvePath(scoped, "address.city.name");
                const street = resolvePath(scoped, "address.street");
                const postalCode = resolvePath(scoped, "address.postalCode");
                const latitude = resolvePath(scoped, "address.latitude");
                const longitude = resolvePath(scoped, "address.longitude");
                const latNum = typeof latitude === "number" && Number.isFinite(latitude) ? latitude : null;
                const lngNum = typeof longitude === "number" && Number.isFinite(longitude) ? longitude : null;

                const IconGlobe = resolveIcon("#Globe");
                const IconMapPin = resolveIcon("#MapPin");
                const IconBuilding = resolveIcon("#Building");
                const IconMail = resolveIcon("#Mail");
                const IconMapPinGeo = resolveIcon("#IconMapPin");

                return (
                    <div
                        key={
                            row != null &&
                            typeof row === "object" &&
                            typeof (row as { _id?: unknown })._id === "string"
                                ? (row as { _id: string })._id
                                : `addr-${idx}`
                        }
                        className={cn(
                            multipleAddresses ? "space-y-1.5" : "space-y-2",
                            multipleAddresses && idx < rows.length - 1 && "border-b border-border/50",
                        )}
                    >
                        <Card>
                            <CardContent>
                                <SheetGrid columns={6}>

                                    <div className="lg:col-span-4 grid grid-cols-3 gap-2 h-fit">
                                        <SmallInfoCard
                                            show={show}
                                            title={String(resolveLanguageKey("form.countryLabel"))}
                                            tooltip={String(resolveLanguageKey("form.countryLabel"))}
                                            Icon={IconGlobe ?? undefined}
                                            value={countryName ?? null}
                                            linkedReferenceSheet={buildLinkedReferenceSheet(
                                                scoped,
                                                "address.country",
                                                "countries",
                                                "#CountrySheetView",
                                                "country",
                                                countryName,
                                                badgeAccessModel,
                                            )}
                                        />
                                        <SmallInfoCard
                                            show={show}
                                            title={String(resolveLanguageKey("form.stateLabel"))}
                                            tooltip={String(resolveLanguageKey("form.stateLabel"))}
                                            Icon={IconMapPin ?? undefined}
                                            value={stateName ?? null}
                                            linkedReferenceSheet={buildLinkedReferenceSheet(
                                                scoped,
                                                "address.state",
                                                "states",
                                                "#StateSheetView",
                                                "state",
                                                stateName,
                                                badgeAccessModel,
                                            )}
                                        />
                                        <SmallInfoCard
                                            show={show}
                                            title={String(resolveLanguageKey("form.cityLabel"))}
                                            tooltip={String(resolveLanguageKey("form.cityLabel"))}
                                            Icon={IconBuilding ?? undefined}
                                            value={cityName ?? null}
                                            linkedReferenceSheet={buildLinkedReferenceSheet(
                                                scoped,
                                                "address.city",
                                                "cities",
                                                "#CitySheetView",
                                                "city",
                                                cityName,
                                                badgeAccessModel,
                                            )}
                                        />
                                        <SmallInfoCard
                                            show={show}
                                            title={String(resolveLanguageKey("form.postalCodeLabel"))}
                                            tooltip={String(resolveLanguageKey("form.postalCodeLabel"))}
                                            Icon={IconMail ?? undefined}
                                            value={postalCode ?? null}
                                        />

                                        <SmallInfoCard
                                            show={show}
                                            title={String(resolveLanguageKey("form.latitudeLabel"))}
                                            tooltip={String(resolveLanguageKey("form.latitudeLabel"))}
                                            Icon={IconMapPinGeo ?? undefined}
                                            value={latNum != null ? String(latNum.toFixed(4)) : null}
                                        />

                                        <SmallInfoCard
                                            show={show}
                                            title={String(resolveLanguageKey("form.longitudeLabel"))}
                                            tooltip={String(resolveLanguageKey("form.longitudeLabel"))}
                                            Icon={IconMapPinGeo ?? undefined}
                                            value={lngNum != null ? String(lngNum.toFixed(4)) : null}
                                        />

                                        <div className="lg:col-span-3">
                                            <SmallInfoCard
                                                show={show}
                                                title={String(resolveLanguageKey("form.streetLabel"))}
                                                tooltip={String(resolveLanguageKey("form.streetLabel"))}
                                                Icon={IconMapPin ?? undefined}
                                                value={street ?? null}
                                            />
                                        </div>
                                    </div>

                                    {latNum != null && lngNum != null ? (
                                        <div className={cn("lg:col-span-2")}>
                                            <SheetLocationMap
                                                address={row}
                                                className={"w-full h-36 min-h-[132px] rounded-lg overflow-hidden"}
                                            />
                                        </div>
                                    ) : null}

                                </SheetGrid>
                            </CardContent>
                        </Card>
                    </div>
                );
            })}
        </div>
    );
}
