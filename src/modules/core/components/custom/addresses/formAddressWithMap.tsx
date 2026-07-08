import { useEffect, useRef, useState } from "react";
import { useFieldArray, useFormContext, type FieldValues } from "react-hook-form";
import {compose} from "redux";
import withLanguage, {type ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import { ApiSelect } from "@coreModule/components/custom/apiSelect";
import MapWithPins from "@coreModule/components/custom/addresses/mapWithPins.tsx";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@coreModule/components/ui/form.tsx";
import { Input } from "@coreModule/components/ui/input.tsx";
import { Button } from "@coreModule/components/ui/button.tsx";
import { CirclePlus, Trash2 } from "lucide-react";

export type FormAddressWithMapLabels = {
    country: string;
    countryPlaceholder: string;
    state: string;
    statePlaceholder: string;
    city: string;
    cityPlaceholder: string;
    street: string;
    streetPlaceholder: string;
    postalCode: string;
    postalCodePlaceholder: string;
    latitude: string;
    latitudePlaceholder: string;
    longitude: string;
    longitudePlaceholder: string;
};

export type FormAddressWithMapProps = {
    resolveLanguageKey: ResolveLanguageKey;
    loading?: boolean;
    disabled?: boolean;
    editMode?: boolean;
    writeAccess?: Record<string, any>;
    /** Dot-prefix for nested RHF paths (default from view `field.name`). */
    fieldPrefix: string;
    /** Optional RHF field-array path. When set, renders add/remove address blocks. */
    arrayField?: string;
    /** Optional RHF string[] path that receives deleted existing address ids in edit mode. */
    deleteField?: string;
    /** Write-access key for nested address permissions. Defaults to "address" for legacy single-address models. */
    writeAccessKey?: string;
    countryApiUrl: string;
    stateApiUrl: string;
    cityApiUrl: string;
    apiMethod?: string;
    mapDefaultLat?: number;
    mapDefaultLng?: number;
    selectPageSizeCreate?: number;
    selectPageSizeEdit?: number;
    addLabel?: string;
    removeLabel?: string;
    labels: FormAddressWithMapLabels;
};

function fieldPath(prefix: string, key: string): keyof FieldValues {
    return `${prefix}.${key}` as keyof FieldValues;
}

/**
 * Config-driven block: country / state / city (cascade), street / postal, lat / lng, optional map column.
 * Driven entirely via `widgetProps` from maestro view configs.
 * Exported for use as the `#FormAddressRow` compound widget inside `#FormRepeater` row templates.
 */
export function SingleFormAddressWithMap({
    resolveLanguageKey,
    loading = false,
    disabled: disabledProp,
    editMode = false,
    writeAccess,
    fieldPrefix,
    writeAccessKey = "address",
    countryApiUrl,
    stateApiUrl,
    cityApiUrl,
    apiMethod = "POST",
    mapDefaultLat = 41.3275,
    mapDefaultLng = 19.8189,
    selectPageSizeCreate = 50,
    selectPageSizeEdit = 200,
    labels,
}: FormAddressWithMapProps) {
    const form = useFormContext<FieldValues>();
    const isDisabled = !!loading || !!disabledProp;
    const pageSize = editMode ? selectPageSizeEdit : selectPageSizeCreate;

    const [forceLoadState, setForceLoadState] = useState(1);
    const [forceLoadCity, setForceLoadCity] = useState(1);
    const initializedCountryRef = useRef(false);
    const initializedStateRef = useRef(false);
    /** Avoid clearing state/city on every re-render in edit mode; only when country truly changes. */
    const prevCountryIdRef = useRef<string | undefined>(undefined);
    const prevStateIdRef = useRef<string | undefined>(undefined);

    const pCountry = fieldPath(fieldPrefix, "country");
    const pState = fieldPath(fieldPrefix, "state");
    const pCity = fieldPath(fieldPrefix, "city");
    const pLat = fieldPath(fieldPrefix, "latitude");
    const pLng = fieldPath(fieldPrefix, "longitude");

    const watchCountry = form.watch(pCountry as any);
    const watchState = form.watch(pState as any);
    const recordId = form.watch("_id" as any);

    useEffect(() => {
        if (!editMode) return;
        initializedCountryRef.current = false;
        initializedStateRef.current = false;
        prevCountryIdRef.current = undefined;
        prevStateIdRef.current = undefined;
    }, [recordId, editMode]);

    useEffect(() => {
        const setState = form.setValue.bind(form);

        if (editMode) {
            if (!watchCountry) {
                prevCountryIdRef.current = undefined;
                return;
            }
            if (!initializedCountryRef.current) {
                initializedCountryRef.current = true;
                prevCountryIdRef.current = watchCountry as string;
                setForceLoadState(Date.now());
                setForceLoadCity(Date.now());
                return;
            }
            if (prevCountryIdRef.current !== watchCountry) {
                prevCountryIdRef.current = watchCountry as string;
                setState(pState, undefined);
                setState(pCity, "");
                setForceLoadState(Date.now());
                setForceLoadCity(Date.now());
            }
            return;
        }

        if (watchCountry) {
            setState(pState, undefined);
            setState(pCity, "");
            setForceLoadState(Date.now());
            setForceLoadCity(Date.now());
        }
        // Intentionally omit `form`: useFormContext value identity can change every render and caused infinite updates.
    }, [watchCountry, editMode, pState, pCity]);

    useEffect(() => {
        const setState = form.setValue.bind(form);

        if (editMode) {
            if (!watchState) {
                prevStateIdRef.current = undefined;
                return;
            }
            if (!initializedStateRef.current) {
                initializedStateRef.current = true;
                prevStateIdRef.current = watchState as string;
                return;
            }
            if (prevStateIdRef.current !== watchState) {
                prevStateIdRef.current = watchState as string;
                setState(pCity, "");
                setForceLoadCity(Date.now());
            }
            return;
        }

        if (watchState) {
            setState(pCity, "");
            setForceLoadCity(Date.now());
        }
    }, [watchState, editMode, pCity]);

    const addressWrite = writeAccess?.[writeAccessKey];
    const keys = addressWrite?.keys ?? {};
    const isEdit = !!editMode;

    const showCascade =
        !isEdit || (addressWrite && keys.country && keys.state && keys.city);
    const showStreet = !isEdit || (addressWrite && (keys.street || keys.postalCode));
    const showLatLng = !isEdit || (addressWrite && (keys.latitude || keys.longitude));
    const showMap = !isEdit || (addressWrite && keys.latitude && keys.longitude);
    const showBlock =
        !isEdit || (addressWrite && (showCascade || showStreet || showLatLng || showMap));

    if (isEdit && !showBlock) return null;

    const latVal = (form.watch(pLat as any) as number | undefined) ?? mapDefaultLat;
    const lngVal = (form.watch(pLng as any) as number | undefined) ?? mapDefaultLng;

    return (
        <div
            className={
                showMap
                    ? // `items-stretch` so the map column gets a real height; `items-start` + `h-full` collapses Leaflet to ~1 line.
                      "grid grid-cols-1 lg:grid-cols-3 gap-4 pe-4 items-stretch"
                    : "grid grid-cols-1 gap-4 pe-4 items-start"
            }
        >
            <div className={showMap ? "lg:col-span-2 space-y-4 min-w-0" : "space-y-4"}>
                {showCascade && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <FormField
                                control={form.control}
                                name={pCountry as any}
                                disabled={isDisabled}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{resolveLanguageKey(labels.country)}</FormLabel>
                                        <FormControl>
                                            <ApiSelect
                                                apiUrl={countryApiUrl}
                                                method={apiMethod}
                                                value={field.value}
                                                onValueChange={(value: string) => field.onChange(value)}
                                                placeholder={resolveLanguageKey(labels.countryPlaceholder)}
                                                disabled={isDisabled}
                                                pageSize={pageSize}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div>
                            <FormField
                                control={form.control}
                                name={pState as any}
                                disabled={isDisabled || !watchCountry}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{resolveLanguageKey(labels.state)}</FormLabel>
                                        <FormControl>
                                            <ApiSelect
                                                apiUrl={stateApiUrl}
                                                method={apiMethod}
                                                postBody={{ country: watchCountry }}
                                                value={field.value}
                                                onValueChange={(value: string) => field.onChange(value)}
                                                placeholder={resolveLanguageKey(labels.statePlaceholder)}
                                                disabled={isDisabled || !watchCountry}
                                                forceLoad={forceLoadState}
                                                pageSize={pageSize}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div>
                            <FormField
                                control={form.control}
                                name={pCity as any}
                                disabled={isDisabled || !watchCountry}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{resolveLanguageKey(labels.city)}</FormLabel>
                                        <FormControl>
                                            <ApiSelect
                                                apiUrl={cityApiUrl}
                                                method={apiMethod}
                                                postBody={{ country: watchCountry, state: watchState }}
                                                value={field.value}
                                                onValueChange={(value: string) => field.onChange(value)}
                                                placeholder={resolveLanguageKey(labels.cityPlaceholder)}
                                                disabled={isDisabled || !watchCountry}
                                                forceLoad={forceLoadCity}
                                                pageSize={pageSize}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                )}
                {showStreet && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(!isEdit || keys.street) && (
                            <div>
                                <FormField
                                    control={form.control}
                                    name={fieldPath(fieldPrefix, "street") as any}
                                    disabled={isDisabled}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{resolveLanguageKey(labels.street)}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={String(
                                                        resolveLanguageKey(labels.streetPlaceholder),
                                                    )}
                                                    disabled={isDisabled}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                        {(!isEdit || keys.postalCode) && (
                            <div>
                                <FormField
                                    control={form.control}
                                    name={fieldPath(fieldPrefix, "postalCode") as any}
                                    disabled={isDisabled}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{resolveLanguageKey(labels.postalCode)}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={String(
                                                        resolveLanguageKey(labels.postalCodePlaceholder),
                                                    )}
                                                    disabled={isDisabled}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                    </div>
                )}
                {showLatLng && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(!isEdit || keys.latitude) && (
                            <div>
                                <FormField
                                    control={form.control}
                                    name={pLat as any}
                                    disabled={isDisabled}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{resolveLanguageKey(labels.latitude)}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.000001"
                                                    placeholder={String(
                                                        resolveLanguageKey(labels.latitudePlaceholder),
                                                    )}
                                                    disabled={isDisabled}
                                                    value={field.value ?? ""}
                                                    onChange={(e) => {
                                                        const v = e.target.value;
                                                        field.onChange(v === "" ? undefined : Number(v));
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                        {(!isEdit || keys.longitude) && (
                            <div>
                                <FormField
                                    control={form.control}
                                    name={pLng as any}
                                    disabled={isDisabled}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{resolveLanguageKey(labels.longitude)}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.000001"
                                                    placeholder={String(
                                                        resolveLanguageKey(labels.longitudePlaceholder),
                                                    )}
                                                    disabled={isDisabled}
                                                    value={field.value ?? ""}
                                                    onChange={(e) => {
                                                        const v = e.target.value;
                                                        field.onChange(v === "" ? undefined : Number(v));
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
            {showMap && (
                <div className="flex flex-col lg:col-span-1 w-full min-h-[220px] h-[220px] lg:h-full lg:min-h-[220px]">
                    <div className="flex-1 min-h-[220px] w-full min-w-0 overflow-hidden">
                        <MapWithPins
                            latitude={latVal}
                            longitude={lngVal}
                            onPinChange={(coords: { lat: number; lng: number } | null) => {
                                if (coords) {
                                    form.setValue(pLat as any, coords.lat);
                                    form.setValue(pLng as any, coords.lng);
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function FormAddressArrayWithMap({
    resolveLanguageKey,
    loading = false,
    disabled,
    editMode = false,
    writeAccess,
    fieldPrefix: _fieldPrefix,
    arrayField = "addresses",
    deleteField = "deleteAddresses",
    addLabel = "addAddress",
    removeLabel = "remove",
    mapDefaultLat = 41.3275,
    mapDefaultLng = 19.8189,
    ...props
}: FormAddressWithMapProps) {

    const form = useFormContext<FieldValues>();
    const {fields, append, remove} = useFieldArray({
        control: form.control,
        name: arrayField as any,
    });

    useEffect(() => {
        if (fields.length === 0 && !editMode) {
            append({
                street: "",
                postalCode: "",
                city: "",
                state: undefined,
                country: "",
                latitude: mapDefaultLat,
                longitude: mapDefaultLng,
            });
        }
    }, [append, editMode, fields.length, mapDefaultLat, mapDefaultLng]);

    const isDisabled = !!loading || !!disabled;

    return (
        <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-end">
                <Button
                    type="button"
                    variant="ghost"
                    className="border-0"
                    disabled={isDisabled}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        append({
                            street: "",
                            postalCode: "",
                            city: "",
                            state: undefined,
                            country: "",
                            latitude: mapDefaultLat,
                            longitude: mapDefaultLng,
                        });
                    }}
                >
                    <CirclePlus className="h-4 w-4" />
                    <span>{resolveLanguageKey(addLabel)}</span>
                </Button>
            </div>
            {fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-border/60 p-3 space-y-3" style={{border: "2px solid red"}}>
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isDisabled}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const currentAddress = form.getValues(`${arrayField}.${index}` as any) as {_id?: string} | undefined;
                                if (editMode && currentAddress?._id) {
                                    const currentDeleted = (form.getValues(deleteField as any) as string[] | undefined) || [];
                                    form.setValue(deleteField as any, [...currentDeleted, currentAddress._id], {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                    });
                                }
                                remove(index);
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                            <span>{resolveLanguageKey(removeLabel)}</span>
                        </Button>
                    </div>
                    <SingleFormAddressWithMap
                        {...props}
                        resolveLanguageKey={resolveLanguageKey}
                        loading={loading}
                        disabled={disabled}
                        editMode={editMode}
                        writeAccess={writeAccess}
                        fieldPrefix={`${arrayField}.${index}`}
                        mapDefaultLat={mapDefaultLat}
                        mapDefaultLng={mapDefaultLng}
                    />
                </div>
            ))}
        </div>
    );
}

function FormAddressWithMap(props: FormAddressWithMapProps) {
    if (props.arrayField) {
        return <FormAddressArrayWithMap {...props} />;
    }
    return <SingleFormAddressWithMap {...props} />;
}

export default compose(
    withLanguage("src/modules/core/components/custom/addresses/formAddressWithMap.tsx")
)(FormAddressWithMap);
