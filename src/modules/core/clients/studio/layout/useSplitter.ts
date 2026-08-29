import {useCallback, useEffect, useRef, useState} from "react";

/**
 * A draggable pane divider.
 *
 * The Studio's panes were fixed — `w-96` tree, `w-80` inspector, `h-56` tool box — which is
 * wrong at both ends: the access simulator lists hundreds of paths through a 224px window,
 * while on a 13" laptop the same fixed widths leave the preview a sliver.
 *
 * Hand-rolled rather than pulling in a panel library: this is a single dev-only tool with
 * three dividers, and pointer capture makes the whole interaction about twenty lines.
 *
 * Persisted on pointer *up*, not on every move — the same lesson as the draft store, where
 * writing storage on every event was the bug.
 */

export type SplitterOptions = {
    min: number;
    max: number;
    /** Which way the size grows relative to pointer movement. */
    direction?: "horizontal" | "vertical";
    /** `"start"` grows with the pointer; `"end"` grows against it (a right-hand pane). */
    edge?: "start" | "end";
};

function readStored(key: string, fallback: number): number {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const value = Number.parseInt(raw, 10);
        return Number.isFinite(value) ? value : fallback;
    } catch {
        return fallback;
    }
}

export type Splitter = {
    size: number;
    dragging: boolean;
    /** Spread onto the divider element. */
    handleProps: {
        onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
        onDoubleClick: () => void;
        role: "separator";
        tabIndex: 0;
        "aria-orientation": "vertical" | "horizontal";
        "aria-label": string;
        onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
    };
};

export function useSplitter(
    storageKey: string,
    defaultSize: number,
    options: SplitterOptions,
): Splitter {
    const {min, max, direction = "horizontal", edge = "start"} = options;

    const [size, setSize] = useState(() => readStored(storageKey, defaultSize));
    const [dragging, setDragging] = useState(false);
    const origin = useRef<{pointer: number; size: number} | null>(null);

    const clamp = useCallback((value: number) => Math.min(max, Math.max(min, value)), [max, min]);

    const persist = useCallback(
        (value: number) => {
            try {
                localStorage.setItem(storageKey, String(value));
            } catch {
                /* A pane width is not worth surfacing a storage failure over. */
            }
        },
        [storageKey],
    );

    useEffect(() => {
        if (!dragging) return;

        const onMove = (event: PointerEvent) => {
            const start = origin.current;
            if (!start) return;
            const pointer = direction === "horizontal" ? event.clientX : event.clientY;
            const delta = pointer - start.pointer;
            setSize(clamp(start.size + (edge === "start" ? delta : -delta)));
        };

        const onUp = () => {
            setDragging(false);
            origin.current = null;
            setSize((current) => {
                persist(current);
                return current;
            });
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
        /* A drag over the preview would otherwise select text the whole way. */
        const previousUserSelect = document.body.style.userSelect;
        document.body.style.userSelect = "none";

        return () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
            document.body.style.userSelect = previousUserSelect;
        };
    }, [dragging, clamp, direction, edge, persist]);

    const onPointerDown = useCallback(
        (event: React.PointerEvent<HTMLElement>) => {
            event.preventDefault();
            origin.current = {
                pointer: direction === "horizontal" ? event.clientX : event.clientY,
                size,
            };
            setDragging(true);
        },
        [direction, size],
    );

    const onKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLElement>) => {
            const decrease = direction === "horizontal" ? "ArrowLeft" : "ArrowUp";
            const increase = direction === "horizontal" ? "ArrowRight" : "ArrowDown";
            if (event.key !== decrease && event.key !== increase) return;
            event.preventDefault();
            const step = event.shiftKey ? 64 : 16;
            const next = clamp(size + (event.key === increase ? step : -step));
            setSize(next);
            persist(next);
        },
        [clamp, direction, persist, size],
    );

    const reset = useCallback(() => {
        setSize(defaultSize);
        persist(defaultSize);
    }, [defaultSize, persist]);

    return {
        size,
        dragging,
        handleProps: {
            onPointerDown,
            onDoubleClick: reset,
            onKeyDown,
            role: "separator",
            tabIndex: 0,
            "aria-orientation": direction === "horizontal" ? "vertical" : "horizontal",
            "aria-label": "Resize pane",
        },
    };
}
