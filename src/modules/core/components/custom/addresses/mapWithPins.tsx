import React, {useEffect, useState} from 'react';
import {MapContainer, TileLayer, Marker, useMapEvents, useMap} from 'react-leaflet';
//@ts-ignore
import L, {LeafletMouseEvent} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {useTheme} from "@coreModule/helpers/context/providers/theme-provider.tsx";

const LIGHT_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const DARK_TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

// Fix default icon issues in Leaflet (for React)
const iconDefaultPrototype = L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown };
delete iconDefaultPrototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface SinglePinMapProps {
    onPinChange?: (coords: { lat: number; lng: number } | null) => void;
    latitude: number,
    longitude: number
    readOnly?: boolean
}

function MapClickHandler({onPinSet, latitude, longitude}: {onPinSet: (latitude: number, longitude: number) => void, latitude: number, longitude: number}) {
    const map = useMap();
    useMapEvents({
        click(e: LeafletMouseEvent) {
            map.setView(e.latlng, map.getZoom(), { animate: true });
            onPinSet(e.latlng.lat, e.latlng.lng);
        },
    });

    useEffect(() => {
        map.setView({lat: latitude, lng: longitude}, map.getZoom(), { animate: true });
    }, [latitude, longitude]);
    return null;
}

const SinglePinMap: React.FC<SinglePinMapProps> = ({ onPinChange, latitude, longitude, readOnly }) => {

    const { theme } = useTheme()
    function resolveTheme(theme: "dark" | "light" | "system") {
        if (theme === "system") {
            return window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
        }
        return theme;
    }

    const [lat, setLat] = useState<number>(latitude); // Default: Tirana, Albania
    const [lng, setLng] = useState<number>(longitude); // Default: Tirana, Albania

    useEffect(() => {
        if( !readOnly ){
            setLat(latitude);
        }
    }, [latitude]);
    useEffect(() => {
        if( !readOnly ){
            setLng(longitude);
        }
    }, [longitude]);

    return (
        <div className="w-full h-full border rounded-xl overflow-hidden relative border-dashed">
            <style>{`
                .leaflet-container {
                    z-index: 1 !important;
                }
                .leaflet-top,
                .leaflet-bottom {
                    z-index: 2 !important;
                }
                .leaflet-pane {
                    z-index: 1 !important;
                }
                .leaflet-control {
                    z-index: 2 !important;
                }
                .leaflet-popup-pane,
                .leaflet-marker-pane,
                .leaflet-overlay-pane {
                    z-index: 2 !important;
                }
            `}</style>
            <MapContainer center={[lat, lng]} zoom={13} className="w-full h-full min-h-[200px]" style={{ zIndex: 1, background: "darkgrey"}}>
                <TileLayer url={resolveTheme(theme) === "dark" ? DARK_TILE_URL : LIGHT_TILE_URL}/>
                <MapClickHandler
                    latitude={latitude}
                    longitude={longitude}
                    onPinSet={(latitude: number, longitude: number) => {
                        if( readOnly ) return;
                        setLat(latitude);
                        setLng(longitude);
                        onPinChange?.({ lat: latitude, lng: longitude });
                    }}
                />
                {(lat && lng) && <Marker position={[lat, lng]} />}
            </MapContainer>
        </div>
    );
};

export default SinglePinMap;
