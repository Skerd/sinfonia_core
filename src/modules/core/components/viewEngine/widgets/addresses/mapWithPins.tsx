import React, {useEffect, useState} from 'react';
import {MapContainer, TileLayer, Marker, useMapEvents, useMap} from 'react-leaflet';
import L, {LeafletMouseEvent} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {CloseMapControl, ExpandMapControl, MapDialog, SyncMapSize} from '@coreModule/components/viewEngine/widgets/addresses/mapChrome.tsx';

const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
/** Carto dark tiles require an API key. Invert OSM tiles under `.dark` instead. */
const DARK_TILE_FILTER = "dark:[&_.leaflet-tile-pane]:[filter:invert(1)_hue-rotate(180deg)_contrast(1.12)_saturate(1.2)_brightness(1.05)]";

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
    onExpand?: () => void
    onClose?: () => void
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

function PinMapCanvas({ onPinChange, latitude, longitude, readOnly, onExpand, onClose }: SinglePinMapProps) {

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
        <div className={`w-full h-full border rounded-xl overflow-hidden relative border-dashed ${DARK_TILE_FILTER}`}>
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
                <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION}/>
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
                <SyncMapSize />
                {onExpand ? <ExpandMapControl onExpand={onExpand} /> : null}
                {onClose ? <CloseMapControl onClose={onClose} /> : null}
            </MapContainer>
        </div>
    );
}

const SinglePinMap: React.FC<SinglePinMapProps> = (props) => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <PinMapCanvas {...props} onExpand={() => setOpen(true)} />
            <MapDialog open={open} onOpenChange={setOpen}>
                <PinMapCanvas
                    latitude={props.latitude}
                    longitude={props.longitude}
                    readOnly={props.readOnly}
                    onPinChange={props.onPinChange}
                    onClose={() => setOpen(false)}
                />
            </MapDialog>
        </>
    );
};

export default SinglePinMap;
