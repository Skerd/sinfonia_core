import {useEffect, useRef, useState} from "react";
import {Download} from "lucide-react";
import {Button} from "@coreModule/components/ui/button.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {SPREADSHEET_PREVIEW_MAX_ROWS, TEXT_PREVIEW_MAX_BYTES} from "@coreModule/components/custom/files/mediaPreviewKind.ts";
import {fetchMediaBytes, fetchMediaText} from "@coreModule/helpers/media/fetchMediaBytes.ts";

type OfficePreviewProps = {
    src: string;
    filename?: string;
    className?: string;
};

export function DocxDialogViewer({src, className}: OfficePreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.replaceChildren();
        setFailed(false);
        const controller = new AbortController();
        (async () => {
            try {
                const {renderAsync} = await import("docx-preview");
                const data = await fetchMediaBytes(src, controller.signal);
                if (controller.signal.aborted) return;
                await renderAsync(data, el, undefined, {
                    inWrapper: true,
                    ignoreWidth: true,
                    ignoreHeight: true,
                });
            } catch {
                if (!controller.signal.aborted) setFailed(true);
            }
        })();
        return () => {
            controller.abort();
            el.replaceChildren();
        };
    }, [src]);

    if (failed) {
        return <p className="text-sm text-muted-foreground p-4">Unable to preview this document.</p>;
    }

    return (
        <div
            ref={containerRef}
            className={cn(
                "max-h-[75vh] max-w-full overflow-auto rounded-lg bg-background p-2 isolate [&>*]:pointer-events-none",
                className,
            )}
        />
    );
}

export function SpreadsheetDialogViewer({src, className}: OfficePreviewProps) {
    const [rows, setRows] = useState<string[][]>([]);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setFailed(false);
        setRows([]);
        const controller = new AbortController();
        (async () => {
            try {
                const XLSX = await import("xlsx");
                const data = await fetchMediaBytes(src, controller.signal);
                if (controller.signal.aborted) return;
                const wb = XLSX.read(data, {type: "array"});
                const sheetName = wb.SheetNames[0];
                if (!sheetName) {
                    setFailed(true);
                    return;
                }
                const sheet = wb.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
                    header: 1,
                    defval: "",
                    raw: false,
                });
                const capped = json.slice(0, SPREADSHEET_PREVIEW_MAX_ROWS).map((row) =>
                    (Array.isArray(row) ? row : []).map((cell) => String(cell ?? "")),
                );
                setRows(capped);
            } catch {
                if (!controller.signal.aborted) setFailed(true);
            }
        })();
        return () => controller.abort();
    }, [src]);

    if (failed) {
        return <p className="text-sm text-muted-foreground p-4">Unable to preview this spreadsheet.</p>;
    }

    if (rows.length === 0) {
        return <p className="text-sm text-muted-foreground p-4">Loading…</p>;
    }

    const colCount = Math.max(1, ...rows.map((r) => r.length));

    return (
        <div className={cn("max-h-[75vh] max-w-full overflow-auto rounded-lg border border-border", className)}>
            <table className="w-max min-w-full text-xs">
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className="border-b border-border/60">
                            {Array.from({length: colCount}, (_, c) => (
                                <td key={c} className="whitespace-pre-wrap px-2 py-1 align-top">
                                    {row[c] ?? ""}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function TextDialogViewer({src, className}: OfficePreviewProps) {
    const [text, setText] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setFailed(false);
        setText(null);
        const controller = new AbortController();
        (async () => {
            try {
                const value = await fetchMediaText(src, controller.signal, TEXT_PREVIEW_MAX_BYTES);
                if (!controller.signal.aborted) setText(value);
            } catch {
                if (!controller.signal.aborted) setFailed(true);
            }
        })();
        return () => controller.abort();
    }, [src]);

    if (failed) {
        return <p className="text-sm text-muted-foreground p-4">Unable to preview this file.</p>;
    }

    if (text == null) {
        return <p className="text-sm text-muted-foreground p-4">Loading…</p>;
    }

    return (
        <pre className={cn("max-h-[75vh] max-w-full overflow-auto rounded-lg bg-muted/40 p-4 text-xs whitespace-pre-wrap", className)}>
            {text}
        </pre>
    );
}

type DetailsFallbackProps = {
    filename?: string;
    mime?: string;
    fileSizeLabel?: string;
    src?: string;
    className?: string;
};

export function FileDetailsFallback({filename, mime, fileSizeLabel, src, className}: DetailsFallbackProps) {
    return (
        <div className={cn("flex flex-col rounded-lg border border-border bg-muted/30 p-6 min-w-[280px] gap-y-2", className)}>
            {filename ? <p className="font-medium break-all">{filename}</p> : null}
            {mime ? <p className="text-sm text-muted-foreground">{mime}</p> : null}
            {fileSizeLabel ? <p className="text-sm text-muted-foreground">{fileSizeLabel}</p> : null}
            {src ? (
                <Button variant="outline" size="sm" className="mt-2 w-fit" asChild>
                    <a href={src} download={filename || true}>
                        <Download className="h-4 w-4" />
                        Download
                    </a>
                </Button>
            ) : null}
        </div>
    );
}
