import MapWithMultiplePins, {MapAddress} from "@coreModule/components/viewEngine/widgets/addresses/mapWithMultiplePins.tsx";

type SheetLocationMapProps = {
    address: MapAddress;
    className?: string;
    /** `widgetProps.areaRadiusM`: a shaded area of this radius (metres) instead of a pin, for an approximate place. */
    areaRadiusM?: number;
};

/** Read-only map for sheet/detail views (same tiles/marker as form MapWithPins, no editing). */
export default function SheetLocationMap({ address, className, areaRadiusM }: SheetLocationMapProps) {
    return (
        // A minimum height: a sheet's layout gives the map none of its own, and a class sent in a view config exists only
        // when the panel's own code uses it (Tailwind builds from these sources), so the map would otherwise collapse.
        <div className={className ?? "w-full h-full min-h-64 flex self-stretch rounded-xl overflow-hidden"}>
            <MapWithMultiplePins addresses={[address]} areaRadiusM={areaRadiusM} />
        </div>
    );
}
