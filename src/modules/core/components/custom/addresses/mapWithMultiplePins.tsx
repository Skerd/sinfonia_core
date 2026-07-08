import {useEffect} from "react";
import {MapContainer, Marker, Popup, TileLayer, useMap} from "react-leaflet";
import L, {type LatLngBoundsExpression, type LatLngExpression} from "leaflet";
import {ExternalLink} from "lucide-react";
import {useTheme} from "@coreModule/helpers/context/providers/theme-provider.tsx";

//@ts-ignore
import iconUrl from "leaflet/dist/images/marker-icon.png";
//@ts-ignore
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
//@ts-ignore
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

const LIGHT_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const DARK_TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

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
    useEffect(() => {
        if (!bounds || bounds.length === 0) return;
        map.fitBounds(bounds as LatLngBoundsExpression, { padding: [40, 40], maxZoom: 14, animate: true });
    }, [map, bounds]);
    return null;
}

function resolveTheme(theme: "dark" | "light" | "system"): "dark" | "light" {
    if (theme === "system") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return theme;
}

type MapWithMultiplePinsProps = {
    addresses: MapAddress[];
    openInGoogleMaps?: string;
    openInAppleMaps?: string;
}

export default function MapWithMultiplePins({
    addresses,
    openInGoogleMaps,
    openInAppleMaps,
}: MapWithMultiplePinsProps) {
    const { theme } = useTheme();
    const list = Array.isArray(addresses) ? addresses : [];
    const bounds = list
        .filter(
            (address): address is MapAddress =>
                address != null &&
                typeof address === "object" &&
                address.latitude != null &&
                address.longitude != null,
        )
        .map((address) => [address.latitude!, address.longitude!] as [number, number]);
    const mapCenter: LatLngExpression = bounds.length > 0 ? bounds[0]! : [0, 0];

    return (
        <div className="w-full rounded-md overflow-hidden shadow-lg relative h-full self-stretch border-dashed">
            <MapContainer
                center={mapCenter}
                zoom={10000}
                style={{width: "100%", height: "150px", zIndex: 1, background: "darkgrey"}}
                scrollWheelZoom={true}
            >
                <TileLayer url={resolveTheme(theme) === "dark" ? DARK_TILE_URL : LIGHT_TILE_URL}/>
                {
                    list.map((address, index) => {
                        if (address == null || typeof address !== "object") return null;
                        if (address.latitude == null || address.longitude == null) return null;
                        let hasAddress = !!address.street || !!address.postalCode || address.city || address.country || address.state;
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
                                                        <ExternalLink className="h-3 w-3 shrink-0" />
                                                    </a>
                                                    <a className="inline-flex items-center gap-0.5 hover:underline shrink-0 whitespace-nowrap" href={`https://maps.apple.com/?q=${address.latitude},${address.longitude}`} target="_blank" rel="noreferrer">
                                                        {openInAppleMaps || "Apple Maps"}
                                                        <ExternalLink className="h-3 w-3 shrink-0" />
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
            </MapContainer>
        </div>
    );
}
