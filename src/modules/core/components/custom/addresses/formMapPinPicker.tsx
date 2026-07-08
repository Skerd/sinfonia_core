import { useFormContext, type FieldValues } from "react-hook-form";
import MapWithPins from "@coreModule/components/custom/addresses/mapWithPins.tsx";

type FormMapPinPickerProps = {
    /** Row prefix injected by `#FormRepeater` (e.g. `"addresses.0"`). */
    fieldPrefix: string;
    /** Relative field name for latitude within the row. Defaults to `"latitude"`. */
    latField?: string;
    /** Relative field name for longitude within the row. Defaults to `"longitude"`. */
    lngField?: string;
    defaultLat?: number;
    defaultLng?: number;
    loading?: boolean;
};

/**
 * `#FormMapPinPicker` — interactive lat/lng map for use inside `#FormRepeater` row templates.
 * `fieldPrefix` is injected by the repeater; `latField`/`lngField` are relative to the row.
 */
export default function FormMapPinPicker({
    fieldPrefix,
    latField = "latitude",
    lngField = "longitude",
    defaultLat = 41.3275,
    defaultLng = 19.8189,
    loading = false,
}: FormMapPinPickerProps) {
    const form = useFormContext<FieldValues>();
    const pLat = fieldPrefix ? `${fieldPrefix}.${latField}` : latField;
    const pLng = fieldPrefix ? `${fieldPrefix}.${lngField}` : lngField;

    const latVal = (form.watch(pLat as any) as number | undefined) ?? defaultLat;
    const lngVal = (form.watch(pLng as any) as number | undefined) ?? defaultLng;

    if (loading) return null;

    return (
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
    );
}
