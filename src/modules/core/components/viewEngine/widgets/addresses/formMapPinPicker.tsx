import type {ComponentType} from "react";
import { useFormContext, type FieldValues } from "react-hook-form";
import withLanguage, {type WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import { useSelector } from "react-redux";
import MapWithPins from "@coreModule/components/viewEngine/widgets/addresses/mapWithPins.tsx";
import type { RootState } from "@coreModule/helpers/redux/store/generalStore.ts";

/** Last resort when neither the field, the widget nor the company has a location (the platform's home city). */
const FALLBACK_CENTER = {latitude: 41.3275, longitude: 19.8189};

type FormMapPinPickerProps = {
    /** Row prefix injected by `#FormRepeater` (e.g. `"addresses.0"`). */
    fieldPrefix: string;
    /** Relative field name for latitude within the row. Defaults to `"latitude"`. */
    latField?: string;
    /** Relative field name for longitude within the row. Defaults to `"longitude"`. */
    lngField?: string;
    /** Where the map opens when the field is empty; defaults to the company's own location (TD-F60). */
    defaultLat?: number;
    defaultLng?: number;
    loading?: boolean;
} & WithLanguageType;

/**
 * `#FormMapPinPicker` — interactive lat/lng map for use inside `#FormRepeater` row templates.
 * `fieldPrefix` is injected by the repeater; `latField`/`lngField` are relative to the row.
 */
function FormMapPinPicker({
    fieldPrefix,
    latField = "latitude",
    lngField = "longitude",
    defaultLat,
    defaultLng,
    loading = false,
    resolveLanguageKey,
}: FormMapPinPickerProps) {
    const form = useFormContext<FieldValues>();
    const pLat = fieldPrefix ? `${fieldPrefix}.${latField}` : latField;
    const pLng = fieldPrefix ? `${fieldPrefix}.${lngField}` : lngField;

    const companyLocation = useSelector((state: RootState) => state.authentication.user.company.location);
    const watchedLat = form.watch(pLat) as number | undefined;
    const watchedLng = form.watch(pLng) as number | undefined;
    // An empty field shows no pin: the map only opens on the company (or the widget's own default), so it can't
    // look as if a location was already chosen.
    const hasPin = typeof watchedLat === "number" && typeof watchedLng === "number";
    const center = defaultLat != null && defaultLng != null ? {latitude: defaultLat, longitude: defaultLng} : companyLocation ?? FALLBACK_CENTER;
    const latVal = hasPin ? watchedLat : center.latitude;
    const lngVal = hasPin ? watchedLng : center.longitude;
    const fieldError = form.getFieldState(pLat, form.formState).error ?? form.getFieldState(pLng, form.formState).error;

    if (loading) return null;

    return (
        <div className="flex-1 min-h-[220px] w-full min-w-0 overflow-hidden">
            <MapWithPins
                latitude={latVal}
                longitude={lngVal}
                showPin={hasPin}
                onPinChange={(coords: { lat: number; lng: number } | null) => {
                    if (coords) {
                        form.setValue(pLat, coords.lat, {shouldValidate: true, shouldDirty: true});
                        form.setValue(pLng, coords.lng, {shouldValidate: true, shouldDirty: true});
                    }
                }}
            />
            {fieldError?.message ? (
                <p role="alert" className="mt-1 text-sm text-destructive">
                    {/* Without a pin the schema's "'Latitude' must be a number" says nothing a person can act on (TD-F114). */}
                    {hasPin ? fieldError.message : resolveLanguageKey("placePin")}
                </p>
            ) : null}
        </div>
    );
}

export default withLanguage("src/modules/core/components/viewEngine/widgets/addresses/formMapPinPicker.tsx")(FormMapPinPicker) as ComponentType<Omit<FormMapPinPickerProps, keyof WithLanguageType>>;
