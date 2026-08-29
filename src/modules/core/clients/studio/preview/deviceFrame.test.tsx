import {render, screen, waitFor} from "@testing-library/react";
import {beforeAll, describe, expect, it} from "vitest";
import {useIsMobile} from "@coreModule/helpers/hooks/useMobile.tsx";
import DeviceFrame from "./deviceFrame.tsx";
import {deviceById} from "./previewDevice.ts";

/** jsdom has no layout, so it has neither ResizeObserver nor matchMedia. */
beforeAll(() => {
    globalThis.ResizeObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
    } as unknown as typeof ResizeObserver;

    window.matchMedia ??= ((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
});

function Probe() {
    return <p>{useIsMobile() ? "mobile layout" : "desktop layout"}</p>;
}

function frameBody(): HTMLElement {
    const frame = screen.getByTitle(/preview$/) as HTMLIFrameElement;
    return frame.contentDocument!.body;
}

describe("DeviceFrame", () => {
    it("renders inline on desktop, with no frame at all", () => {
        render(
            <DeviceFrame device={deviceById("desktop")}>
                <p>preview body</p>
            </DeviceFrame>,
        );

        expect(screen.getByText("preview body")).toBeInTheDocument();
        expect(screen.queryByTitle(/preview$/)).not.toBeInTheDocument();
    });

    it("portals the preview into a frame with its own document", async () => {
        render(
            <DeviceFrame device={deviceById("mobile")}>
                <p>preview body</p>
            </DeviceFrame>,
        );

        await waitFor(() => expect(frameBody().textContent).toContain("preview body"));
    });

    it("tells `useIsMobile` inside the frame which device it is", async () => {
        const {rerender} = render(
            <DeviceFrame device={deviceById("mobile")}>
                <Probe />
            </DeviceFrame>,
        );
        await waitFor(() => expect(frameBody().textContent).toBe("mobile layout"));

        rerender(
            <DeviceFrame device={deviceById("tablet")}>
                <Probe />
            </DeviceFrame>,
        );
        await waitFor(() => expect(frameBody().textContent).toBe("desktop layout"));
    });

    it("carries the host's theme class into the frame", async () => {
        document.documentElement.classList.add("dark");
        try {
            render(
                <DeviceFrame device={deviceById("mobile")}>
                    <p>themed</p>
                </DeviceFrame>,
            );

            await waitFor(() =>
                expect(frameBody().ownerDocument.documentElement).toHaveClass("dark"),
            );
        } finally {
            document.documentElement.classList.remove("dark");
        }
    });
});
