import {useEffect, useRef, useState, type PointerEvent} from "react";
import {Button} from "@coreModule/components/ui/button.tsx";

/** Dark ink on a transparent background, so the PNG reads on paper and in a PDF. */
const INK = "#111827";
const LINE_WIDTH = 2.2;

type Props = {
    /** The drawing as a PNG file after each stroke; `null` once cleared. */
    onChange: (file: File | null) => void;
    ariaLabel: string;
    clearLabel: string;
    hint?: string;
    disabled?: boolean;
    height?: number;
};

/** A box to sign in with a finger, pen or mouse. */
export default function SignaturePad({onChange, ariaLabel, clearLabel, hint, disabled = false, height = 160}: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const drawing = useRef(false);
    const [empty, setEmpty] = useState(true);

    // Sized in device pixels so strokes stay sharp on high-density screens.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ratio = window.devicePixelRatio || 1;
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = height * ratio;
        const context = canvas.getContext("2d");
        if (!context) return;
        context.scale(ratio, ratio);
        context.lineWidth = LINE_WIDTH;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = INK;
    }, [height]);

    const point = (event: PointerEvent<HTMLCanvasElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        return {x: event.clientX - rect.left, y: event.clientY - rect.top};
    };

    const start = (event: PointerEvent<HTMLCanvasElement>) => {
        if (disabled) return;
        const context = canvasRef.current?.getContext("2d");
        if (!context) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drawing.current = true;
        const {x, y} = point(event);
        context.beginPath();
        context.moveTo(x, y);
    };

    const move = (event: PointerEvent<HTMLCanvasElement>) => {
        if (!drawing.current) return;
        const context = canvasRef.current?.getContext("2d");
        if (!context) return;
        const {x, y} = point(event);
        context.lineTo(x, y);
        context.stroke();
    };

    const end = () => {
        if (!drawing.current) return;
        drawing.current = false;
        setEmpty(false);
        canvasRef.current?.toBlob((blob) => {
            if (blob) onChange(new File([blob], "signature.png", {type: "image/png"}));
        }, "image/png");
    };

    const clear = () => {
        const canvas = canvasRef.current;
        canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
        setEmpty(true);
        onChange(null);
    };

    return (
        <div className="flex flex-col gap-2">
            <canvas
                ref={canvasRef}
                role="img"
                aria-label={ariaLabel}
                className="w-full touch-none rounded-md border border-input bg-white"
                style={{height}}
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={end}
                onPointerLeave={end}
            />
            <div className="flex items-center justify-between gap-2">
                {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : <span />}
                <Button type="button" variant="ghost" size="sm" onClick={clear} disabled={disabled || empty}>
                    {clearLabel}
                </Button>
            </div>
        </div>
    );
}
