import {Children, type CSSProperties, type ReactNode, useLayoutEffect, useRef, useState} from "react";

/**
 * First row runs left to right, then each column stacks on its own.
 * A CSS grid row would stretch to the tallest card and leave a hole under a short one.
 */
export function CardMosaic({className, children}: {className?: string; children: ReactNode}) {
    const ref = useRef<HTMLDivElement>(null);
    const [columns, setColumns] = useState(1);

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;

        const measure = () => {
            const cs = getComputedStyle(el);
            const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
            const px = (raw: string) => {
                const n = parseFloat(raw);
                return Number.isFinite(n) && raw.trim().endsWith("rem") ? n * root : n || 0;
            };
            const width = el.clientWidth;
            const minCard = px(cs.getPropertyValue("--grid-card-basis"));
            const gap = Math.max(0, px(cs.getPropertyValue("--density-gap")));
            const max = Math.max(1, Math.floor(Number(cs.getPropertyValue("--grid-cols-max"))) || 1);
            let next = 1;
            for (let n = max; n > 1 && minCard > 0; n--) {
                if ((width - (n - 1) * gap) / n >= minCard - 1) {
                    next = n;
                    break;
                }
            }
            setColumns((prev) => (prev === next ? prev : next));
        };

        measure();
        const resize = new ResizeObserver(measure);
        resize.observe(el);
        const density = new MutationObserver(measure);
        density.observe(document.documentElement, {attributes: true, attributeFilter: ["data-density"]});
        return () => {
            resize.disconnect();
            density.disconnect();
        };
    }, [className]);

    const items = Children.toArray(children);
    const lanes: ReactNode[][] = Array.from({length: columns}, () => []);
    items.forEach((item, index) => lanes[index % columns].push(item));

    return (
        <div ref={ref} className={className} style={{"--mosaic-cols": columns} as CSSProperties}>
            {lanes.map((lane, index) => (
                <div key={index} className="flex min-w-0 flex-col gap-(--density-gap)">{lane}</div>
            ))}
        </div>
    );
}
