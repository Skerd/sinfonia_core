import {useCallback, useState} from "react";

/**
 * Device widths the preview can be rendered at.
 *
 * Width has to be a real viewport, not a narrow container: the view configs lean on
 * `md:col-span-2` and `lg:grid-cols-3`, and a media query answers to the viewport whatever
 * the parent element measures. That is why `desktop` renders inline and the other two render
 * inside a frame — see `deviceFrame.tsx`.
 */

export type PreviewDeviceId = "desktop" | "tablet" | "mobile";

export type PreviewDevice = {
    id: PreviewDeviceId;
    label: string;
    /** CSS pixels. `undefined` on desktop, which simply fills the pane. */
    width?: number;
    height?: number;
};

/** Mirrors `MOBILE_BREAKPOINT` in `helpers/hooks/useMobile.tsx`. */
export const MOBILE_BREAKPOINT = 768;

export const PREVIEW_DEVICES: PreviewDevice[] = [
    {id: "desktop", label: "Desktop"},
    /* Portrait iPad Air: the widest thing that is still not a desktop. */
    {id: "tablet", label: "Tablet", width: 834, height: 1112},
    /* iPhone 14/15: narrower than the 768px `useIsMobile` threshold, so card layouts show. */
    {id: "mobile", label: "Mobile", width: 390, height: 844},
];

export function deviceById(id: string): PreviewDevice {
    return PREVIEW_DEVICES.find((device) => device.id === id) ?? PREVIEW_DEVICES[0]!;
}

/** What `useIsMobile` must answer inside the frame, so JS and CSS agree on the device. */
export function isMobileViewport(device: PreviewDevice): boolean | null {
    return device.width == null ? null : device.width < MOBILE_BREAKPOINT;
}

/**
 * Shrinks a frame that is wider than the pane holding it. Never scales up: a phone rendered
 * at 150% would flatter every tap target on it.
 */
export function scaleToFit(deviceWidth: number, available: number): number {
    if (!Number.isFinite(available) || available <= 0) return 1;
    return Math.min(1, available / deviceWidth);
}

const STORAGE_KEY = "studio:preview:device:v1";

function readStored(): PreviewDeviceId {
    try {
        return deviceById(localStorage.getItem(STORAGE_KEY) ?? "desktop").id;
    } catch {
        return "desktop";
    }
}

/** The chosen device, remembered per browser like the pane splitters. */
export function usePreviewDevice(): [PreviewDevice, (id: PreviewDeviceId) => void] {
    const [id, setId] = useState<PreviewDeviceId>(readStored);

    const select = useCallback((next: PreviewDeviceId) => {
        setId(next);
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            /* Private mode: the choice just does not outlive the tab. */
        }
    }, []);

    return [deviceById(id), select];
}
