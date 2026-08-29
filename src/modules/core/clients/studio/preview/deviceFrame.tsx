import {useEffect, useRef, useState, type ReactNode} from "react";
import {createPortal} from "react-dom";
import {MobileOverrideContext} from "@coreModule/helpers/hooks/useMobile.tsx";
import {isMobileViewport, scaleToFit, type PreviewDevice} from "./previewDevice.ts";

/**
 * Renders the preview at a device viewport.
 *
 * An `iframe` rather than a narrow `div`, because the thing being checked is a media query:
 * `md:col-span-2` asks the viewport how wide it is, and a 390px column inside a 1600px window
 * is still a desktop viewport. The frame gives the subtree a viewport of its own; React keeps
 * rendering it through a portal, so context, redux and the draft all still reach it.
 *
 * Two consequences worth knowing:
 *  - The subtree's JavaScript still runs in the host window, so `window.matchMedia` there
 *    would answer for the host. {@link MobileOverrideContext} closes that gap for the one
 *    hook that asks (`useIsMobile`, which decides cards vs table).
 *  - Radix portals default to the host `document.body`, so a select or tooltip opened inside
 *    the frame renders outside it. Layout is what this is for; interaction is not.
 */

const STYLE_MARK = "data-studio-frame-style";

/** Copies the host's stylesheets and theme classes into the frame. */
function syncFrameStyles(frameDoc: Document): void {
    for (const stale of frameDoc.head.querySelectorAll(`[${STYLE_MARK}]`)) stale.remove();

    for (const node of document.head.querySelectorAll('style, link[rel="stylesheet"]')) {
        const clone = node.cloneNode(true) as HTMLElement;
        clone.setAttribute(STYLE_MARK, "");
        frameDoc.head.appendChild(clone);
    }

    /* The theme is a class on `<html>`, so the frame has to carry the same one. */
    frameDoc.documentElement.className = document.documentElement.className;
    frameDoc.body.className = `${document.body.className} bg-background text-foreground`.trim();
    frameDoc.body.style.margin = "0";
    frameDoc.body.style.height = "100vh";
    frameDoc.body.style.display = "flex";
    frameDoc.body.style.flexDirection = "column";
}

function PreviewFrame({
    device,
    children,
}: {
    device: PreviewDevice & {width: number};
    children: ReactNode;
}) {
    const frameRef = useRef<HTMLIFrameElement | null>(null);
    const [frameDoc, setFrameDoc] = useState<Document | null>(null);

    /* `srcDoc`/`about:blank` frames are ready at different moments across browsers, so take
       the document from whichever of mount and load happens first. */
    const attach = () => {
        const doc = frameRef.current?.contentDocument ?? null;
        if (doc) setFrameDoc(doc);
    };

    useEffect(() => {
        if (!frameDoc) return;
        syncFrameStyles(frameDoc);

        /* Vite replaces `<style>` contents on every HMR update; without this the frame keeps
           the stylesheet it was born with and slowly drifts from the editor beside it. */
        const observer = new MutationObserver(() => syncFrameStyles(frameDoc));
        observer.observe(document.head, {childList: true, subtree: true, characterData: true});
        const themeObserver = new MutationObserver(() => syncFrameStyles(frameDoc));
        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => {
            observer.disconnect();
            themeObserver.disconnect();
        };
    }, [frameDoc]);

    return (
        <iframe
            ref={(node) => {
                frameRef.current = node;
                attach();
            }}
            onLoad={attach}
            title={`${device.label} preview`}
            className="block h-full w-full border-0 bg-background"
        >
            {frameDoc &&
                createPortal(
                    <MobileOverrideContext.Provider value={isMobileViewport(device)}>
                        {children}
                    </MobileOverrideContext.Provider>,
                    frameDoc.body,
                )}
        </iframe>
    );
}

export default function DeviceFrame({
    device,
    children,
}: {
    device: PreviewDevice;
    children: ReactNode;
}) {
    const holderRef = useRef<HTMLDivElement | null>(null);
    const [available, setAvailable] = useState(0);

    useEffect(() => {
        const holder = holderRef.current;
        if (!holder || device.width == null) return;

        const observer = new ResizeObserver(([entry]) => {
            setAvailable(entry?.contentRect.width ?? 0);
        });
        observer.observe(holder);
        return () => observer.disconnect();
    }, [device.width]);

    /* Desktop is the pane itself — no frame, so nothing about today's preview changes. */
    if (device.width == null) return <>{children}</>;

    const scale = scaleToFit(device.width, available);
    const height = device.height ?? 800;

    return (
        <div ref={holderRef} className="min-h-0 flex-1 overflow-auto bg-muted/30 p-3">
            <div
                /* A transform does not change layout, so the wrapper carries the scaled
                   footprint — otherwise centering and scrolling both use the unscaled width. */
                style={{width: device.width * scale, height: height * scale}}
                className="mx-auto"
            >
                <div
                    style={{
                        width: device.width,
                        height,
                        transform: `scale(${scale})`,
                        transformOrigin: "top left",
                    }}
                    className="overflow-hidden rounded-lg border bg-background shadow-sm"
                >
                    <PreviewFrame device={{...device, width: device.width}}>{children}</PreviewFrame>
                </div>
            </div>
        </div>
    );
}
