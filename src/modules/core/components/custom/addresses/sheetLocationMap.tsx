import MapWithMultiplePins, {MapAddress} from "@coreModule/components/custom/addresses/mapWithMultiplePins.tsx";

type SheetLocationMapProps = {
    address: MapAddress;
    className?: string;
};

/** Read-only map for sheet/detail views (same tiles/marker as form MapWithPins, no editing). */
export default function SheetLocationMap({ address, className }: SheetLocationMapProps) {
    return (
        <div className={className ?? "w-full h-full flex self-stretch rounded-xl overflow-hidden"}>
            <MapWithMultiplePins addresses={[address]} />
        </div>
    );
}
