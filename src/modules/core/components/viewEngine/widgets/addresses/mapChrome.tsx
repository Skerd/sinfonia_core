import {useEffect, useRef, type ReactNode} from "react";
import {useMap} from "react-leaflet";
import L from "leaflet";
import {Dialog, DialogContent, DialogTitle} from "@coreModule/components/ui/dialog.tsx";

const EXPAND_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/></svg>`;
const CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;

/** Leaflet bar button on the map's top-right, same chrome as the zoom control. */
function MapCornerControl({label, icon, onClick}: {label: string; icon: string; onClick: () => void}) {
    const map = useMap();
    const onClickRef = useRef(onClick);
    onClickRef.current = onClick;

    useEffect(() => {
        const control = new L.Control({position: "topright"});
        control.onAdd = () => {
            const container = L.DomUtil.create("div", "leaflet-bar leaflet-control leaflet-control-map-corner");
            const link = L.DomUtil.create("a", "", container);
            link.href = "#";
            link.title = label;
            link.setAttribute("role", "button");
            link.setAttribute("aria-label", label);
            link.innerHTML = icon;
            L.DomEvent.disableClickPropagation(container);
            L.DomEvent.disableScrollPropagation(container);
            L.DomEvent.on(link, "click", (event: Event) => {
                L.DomEvent.stop(event);
                onClickRef.current();
            });
            return container;
        };
        control.addTo(map);
        return () => {
            control.remove();
        };
    }, [map, label, icon]);

    return null;
}

export function ExpandMapControl({onExpand}: {onExpand: () => void}) {
    return <MapCornerControl label="Expand map" icon={EXPAND_ICON} onClick={onExpand} />;
}

export function CloseMapControl({onClose}: {onClose: () => void}) {
    return <MapCornerControl label="Close" icon={CLOSE_ICON} onClick={onClose} />;
}

/** Leaflet measures its container once. Dialogs and card layouts change that size after mount. */
export function SyncMapSize() {
    const map = useMap();
    useEffect(() => {
        const container = map.getContainer();
        const sync = () => {
            map.invalidateSize();
        };
        sync();
        const observer = new ResizeObserver(sync);
        observer.observe(container);
        const timer = window.setTimeout(sync, 200);
        return () => {
            observer.disconnect();
            window.clearTimeout(timer);
        };
    }, [map]);
    return null;
}

export function MapDialog({
    open,
    onOpenChange,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showCloseButton={false}
                className="flex h-[min(86vh,52rem)] w-[min(96vw,72rem)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-3 sm:max-w-[min(96vw,72rem)]"
            >
                <DialogTitle className="sr-only">Map</DialogTitle>
                <div className="min-h-0 w-full flex-1">{open ? children : null}</div>
            </DialogContent>
        </Dialog>
    );
}
