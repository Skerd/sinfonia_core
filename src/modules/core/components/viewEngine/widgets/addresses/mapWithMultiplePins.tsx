import {IconExternalLink} from "@tabler/icons-react";
import {useEffect, useLayoutEffect, useState} from "react";
import {Circle, MapContainer, Marker, Popup, TileLayer, useMap} from "react-leaflet";
import L, {type LatLngBoundsExpression, type LatLngExpression} from "leaflet";
import {CloseMapControl, ExpandMapControl, MapDialog, SyncMapSize} from "@coreModule/components/viewEngine/widgets/addresses/mapChrome.tsx";
import {settleMapAnimations} from "@coreModule/components/viewEngine/widgets/addresses/mapTeardown.ts";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    iconSize: [25, 41],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
/** Carto dark tiles require an API key. Invert OSM tiles under `.dark` instead. */
const DARK_TILE_FILTER = "dark:[&_.leaflet-tile-pane]:[filter:invert(1)_hue-rotate(180deg)_contrast(1.12)_saturate(1.2)_brightness(1.05)]";

export type MapAddress = {
    _id: string
    street?: string
    postalCode?: string
    city?: {
        _id: string
        name: string
    }
    state?: {
        _id: string
        name: string
    }
    country?: {
        _id: string
        name: string
        code?: string
    }
    latitude?: number
    longitude?: number
}

function FitBounds({ bounds }: { bounds: [number, number][] }) {
    const map = useMap();
    // Refit only when the points change (`bounds` is a new array on every render), and without a zoom animation: a
    // fit's zoom transition ends on a timer that Leaflet does not cancel, so a sheet closed during it hit the removed
    // map (`_leaflet_pos` of undefined, TD-F68). The map opens already framed instead.
    const boundsKey = JSON.stringify(bounds);
    useEffect(() => {
        const points = JSON.parse(boundsKey) as [number, number][];
        if (points.length === 0) return;
        map.fitBounds(points as LatLngBoundsExpression, { padding: [40, 40], maxZoom: 14, animate: false });
    }, [map, boundsKey]);
    // Layout cleanups run before react-leaflet removes the map: settle a pan, wheel zoom or zoom animation still running.
    useLayoutEffect(() => () => {
        settleMapAnimations(map);
    }, [map]);
    return null;
}

type MapWithMultiplePinsProps = {
    addresses: MapAddress[];
    openInGoogleMaps?: string;
    openInAppleMaps?: string;
    /**
     * Shows each point as a shaded area of this radius (metres) instead of a pin: an approximate place whose exact
     * spot is private (a job before its award, D143). The point is already the approximate centre.
     */
    areaRadiusM?: number;
}

/** The corners of a circle around a point, so the map fits the whole area. */
function areaBounds(latitude: number, longitude: number, radiusM: number): [number, number][] {
    const dLat = radiusM / 111320;
    const dLng = radiusM / (111320 * Math.cos((latitude * Math.PI) / 180));
    return [[latitude - dLat, longitude - dLng], [latitude + dLat, longitude + dLng]];
}

function MapCanvas({
    addresses,
    openInGoogleMaps,
    openInAppleMaps,
    areaRadiusM,
    onExpand,
    onClose,
}: MapWithMultiplePinsProps & { onExpand?: () => void; onClose?: () => void }) {
    const list = Array.isArray(addresses) ? addresses : [];
    const bounds = list
        .filter(
            (address): address is MapAddress =>
                address != null &&
                typeof address === "object" &&
                address.latitude != null &&
                address.longitude != null,
        )
        .flatMap((address) => areaRadiusM
            ? areaBounds(address.latitude!, address.longitude!, areaRadiusM)
            : [[address.latitude!, address.longitude!] as [number, number]]);
    const mapCenter: LatLngExpression = bounds.length > 0 ? bounds[0]! : [0, 0];

    return (
        <div className={`w-full rounded-md overflow-hidden shadow-lg relative h-full self-stretch border-dashed ${DARK_TILE_FILTER}`}>
            <MapContainer
                center={mapCenter}
                zoom={10000}
                className="h-full w-full"
                style={{width: "100%", height: "100%", zIndex: 1, background: "darkgrey"}}
                scrollWheelZoom={true}
            >
                <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION}/>
                {
                    list.map((address, index) => {
                        if (address == null || typeof address !== "object") return null;
                        if (address.latitude == null || address.longitude == null) return null;
                        if (areaRadiusM) {
                            return (
                                <Circle
                                    key={address._id ?? `area-${index}`}
                                    center={[address.latitude, address.longitude]}
                                    radius={areaRadiusM}
                                    className="fill-primary stroke-primary"
                                    pathOptions={{fillOpacity: 0.18, weight: 2}}
                                />
                            );
                        }
                        const hasAddress = !!address.street || !!address.postalCode || address.city || address.country || address.state;
                        let fullAddress = "";
                        if( hasAddress ){
                            fullAddress = [
                                address.street,
                                address?.city?.name,
                                address?.state?.name,
                                address?.country?.name,
                                address.postalCode,
                            ].filter(Boolean).join(", ");
                        }
                        return (
                            <Marker key={address._id ?? `pin-${index}`} position={[address.latitude, address.longitude]}>
                                <>
                                    {
                                        hasAddress &&
                                        <Popup className="min-w-0! [&_.leaflet-popup-content-wrapper]:p-0! [&_.leaflet-popup-content]:p-1! [&_.leaflet-popup-content]:m-0! [&_.leaflet-popup-content]:!min-h-0]">
                                            <div className="flex flex-col gap-0.5 text-xs">
                                                <span className="font-semibold leading-tight block ">{fullAddress}</span>
                                                <div className="flex flex-nowrap gap-x-3">
                                                    <a className="inline-flex items-center gap-0.5 hover:underline shrink-0 whitespace-nowrap" href={`https://www.google.com/maps?q=${address.latitude},${address.longitude}`} target="_blank" rel="noreferrer">
                                                        {openInGoogleMaps || "Google Maps"}
                                                        <IconExternalLink className="h-3 w-3 shrink-0" />
                                                    </a>
                                                    <a className="inline-flex items-center gap-0.5 hover:underline shrink-0 whitespace-nowrap" href={`https://maps.apple.com/?q=${address.latitude},${address.longitude}`} target="_blank" rel="noreferrer">
                                                        {openInAppleMaps || "Apple Maps"}
                                                        <IconExternalLink className="h-3 w-3 shrink-0" />
                                                    </a>
                                                </div>
                                            </div>
                                        </Popup>
                                    }
                                </>
                            </Marker>
                        )
                    })
                }
                <FitBounds bounds={bounds} />
                <SyncMapSize />
                {onExpand ? <ExpandMapControl onExpand={onExpand} /> : null}
                {onClose ? <CloseMapControl onClose={onClose} /> : null}
            </MapContainer>
        </div>
    );
}

export default function MapWithMultiplePins(props: MapWithMultiplePinsProps) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <MapCanvas {...props} onExpand={() => setOpen(true)} />
            <MapDialog open={open} onOpenChange={setOpen}>
                <MapCanvas {...props} onClose={() => setOpen(false)} />
            </MapDialog>
        </>
    );
}
