import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import DisplayCard from "@coreModule/components/viewEngine/widgets/display/displayCard.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import SheetLocationMap from "@coreModule/components/viewEngine/widgets/addresses/sheetLocationMap.tsx";
import { resolveIcon } from "../../../widgetRegistry.ts";
import { cn } from "@coreModule/components/lib/utils.ts";
import {SheetGrid} from "@coreModule/components/viewEngine/widgets/layout/sheet/grid.tsx";
import {Card, CardContent} from "@coreModule/components/ui/card.tsx";
import {bootstrapLinkedSheetData, normalizeObjectIdRef, resolvePath} from "../../../engine/refs.ts";
import {linkedReferenceSheet, type LinkedReferenceSheet} from "../../linkedSheet/linkedSheetHost.tsx";

/** Nested tenancy sheet for the country / state / city ref at `path` of an address. */
function addressRefSheet(
    address: Record<string, any>,
    path: string,
    model: string,
    widgetToken: string,
    entityProp: string,
    displayValue: unknown,
): LinkedReferenceSheet | undefined {
    const raw = resolvePath(address, path);
    const id = normalizeObjectIdRef(raw)?.fetchId;
    if (!id) return undefined;
    return linkedReferenceSheet(model, {
        widgetToken,
        fetchId: id,
        entityProp,
        entity: bootstrapLinkedSheetData(id, raw, displayValue),
        onDelete: () => {},
    });
}

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
};

/**
 * Renders each `addresses[]` entry — or a single embedded `address` object — with a shared grid + optional map layout.
 */
export default function SheetCompanyAddressesSection({
    addresses,
    resolveLanguageKey,
    show = true,
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
        <div className={multipleAddresses ? "flex flex-col gap-3" : "flex flex-col gap-4"}>
            {rows.map((row: any, idx: number) => {
                const countryName = resolvePath(row, "country.name");
                const stateName = resolvePath(row, "state.name");
                const cityName = resolvePath(row, "city.name");
                const street = row.street;
                const postalCode = row.postalCode;
                const latitude = row.latitude;
                const longitude = row.longitude;
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
                            multipleAddresses ? "flex flex-col gap-1.5" : "flex flex-col gap-2",
                            multipleAddresses && idx < rows.length - 1 && "border-b border-border/50",
                        )}
                    >
                        <Card>
                            <CardContent>
                                <SheetGrid columns={6}>

                                    <div className="lg:col-span-4 grid grid-cols-3 gap-2 h-fit">
                                        <DisplayCard
                                            show={show}
                                            title={String(resolveLanguageKey("form.countryLabel"))}
                                            tooltip={String(resolveLanguageKey("form.countryLabel"))}
                                            Icon={IconGlobe ?? undefined}
                                            value={countryName ?? null}
                                            linkedReferenceSheet={addressRefSheet(row, "country", "countries", "#CountrySheetView", "country", countryName)}
                                        />
                                        <DisplayCard
                                            show={show}
                                            title={String(resolveLanguageKey("form.stateLabel"))}
                                            tooltip={String(resolveLanguageKey("form.stateLabel"))}
                                            Icon={IconMapPin ?? undefined}
                                            value={stateName ?? null}
                                            linkedReferenceSheet={addressRefSheet(row, "state", "states", "#StateSheetView", "state", stateName)}
                                        />
                                        <DisplayCard
                                            show={show}
                                            title={String(resolveLanguageKey("form.cityLabel"))}
                                            tooltip={String(resolveLanguageKey("form.cityLabel"))}
                                            Icon={IconBuilding ?? undefined}
                                            value={cityName ?? null}
                                            linkedReferenceSheet={addressRefSheet(row, "city", "cities", "#CitySheetView", "city", cityName)}
                                        />
                                        <DisplayCard
                                            show={show}
                                            title={String(resolveLanguageKey("form.postalCodeLabel"))}
                                            tooltip={String(resolveLanguageKey("form.postalCodeLabel"))}
                                            Icon={IconMail ?? undefined}
                                            value={postalCode ?? null}
                                        />

                                        <DisplayCard
                                            show={show}
                                            title={String(resolveLanguageKey("form.latitudeLabel"))}
                                            tooltip={String(resolveLanguageKey("form.latitudeLabel"))}
                                            Icon={IconMapPinGeo ?? undefined}
                                            value={latNum != null ? String(latNum.toFixed(4)) : null}
                                        />

                                        <DisplayCard
                                            show={show}
                                            title={String(resolveLanguageKey("form.longitudeLabel"))}
                                            tooltip={String(resolveLanguageKey("form.longitudeLabel"))}
                                            Icon={IconMapPinGeo ?? undefined}
                                            value={lngNum != null ? String(lngNum.toFixed(4)) : null}
                                        />

                                        <div className="lg:col-span-3">
                                            <DisplayCard
                                                show={show}
                                                title={String(resolveLanguageKey("form.streetLabel"))}
                                                tooltip={String(resolveLanguageKey("form.streetLabel"))}
                                                Icon={IconMapPin ?? undefined}
                                                value={street ?? null}
                                            />
                                        </div>
                                    </div>

                                    {latNum != null && lngNum != null ? (
                                        <div className="relative min-h-[220px] self-stretch lg:col-span-2">
                                            <SheetLocationMap
                                                address={row}
                                                className="absolute inset-0 h-full w-full overflow-hidden rounded-lg"
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
