import {
    cloneElement,
    isValidElement,
    useCallback,
    useEffect,
    useRef,
    useState,
    type ClipboardEvent,
    type KeyboardEvent,
    type ReactElement,
    type ReactNode,
} from "react";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

const MODAL_CONTENT_SELECTOR = [
    '[data-slot="alert-dialog-content"]',
    '[data-slot="dialog-content"]',
    '[data-slot="sheet-content"]',
].join(",");

function isInsertKeyAtMax(e: KeyboardEvent): boolean {
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    if (
        e.key === "Backspace" ||
        e.key === "Delete" ||
        e.key === "Tab" ||
        e.key === "Enter" ||
        e.key === "Escape" ||
        e.key.startsWith("Arrow") ||
        e.key === "Home" ||
        e.key === "End" ||
        e.key === "PageUp" ||
        e.key === "PageDown"
    ) {
        return false;
    }
    return e.key.length === 1;
}

type FormMaxLengthControlProps = WithLanguageType & {
    maxLength: number;
    value?: string | null;
    className?: string;
    children: ReactNode;
    withLanguage?: unknown;
    id?: string;
    "aria-invalid"?: boolean | "true" | "false";
    "aria-describedby"?: string;
    "aria-required"?: boolean | "true" | "false";
    "data-slot"?: string;
};

function FormMaxLengthControl({
    maxLength,
    value,
    className,
    children,
    resolveLanguageKey,
    currentLanguage: _currentLanguage,
    languageCode: _languageCode,
    withLanguage: _withLanguage,
    id,
    "aria-invalid": ariaInvalid,
    "aria-describedby": ariaDescribedBy,
    "aria-required": ariaRequired,
    "data-slot": dataSlot,
}: FormMaxLengthControlProps) {
    const [open, setOpen] = useState(false);
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const modal = wrapRef.current?.closest(MODAL_CONTENT_SELECTOR);
        setPortalContainer(modal instanceof HTMLElement ? modal : null);
    }, []);

    useEffect(() => {
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []);

    const showHint = useCallback((length?: number) => {
        const len = length ?? String(value ?? "").length;
        if (len < maxLength) return;
        setOpen(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setOpen(false), 2500);
    }, [maxLength, value]);

    if (!isValidElement(children)) {
        return children;
    }

    const currentLength = String(value ?? "").length;
    const atMax = currentLength >= maxLength;
    const tooltip = String(resolveLanguageKey("maxLengthReached")).replace("{max}", String(maxLength));

    const child = children as ReactElement<{
        value?: string;
        onKeyDown?: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
        onPaste?: (e: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
        onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    }>;

    // FormControl's Slot merges aria-invalid / id onto this component. Forward them to the
    // actual input so error borders (`aria-invalid:border-destructive`) still apply.
    const wrapped = cloneElement(child, {
        ...(id !== undefined ? {id} : {}),
        ...(ariaInvalid !== undefined ? {"aria-invalid": ariaInvalid} : {}),
        ...(ariaDescribedBy !== undefined ? {"aria-describedby": ariaDescribedBy} : {}),
        ...(ariaRequired !== undefined ? {"aria-required": ariaRequired} : {}),
        ...(dataSlot !== undefined ? {"data-slot": dataSlot} : {}),
        onKeyDown: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            if (atMax && isInsertKeyAtMax(e)) {
                showHint();
            }
            child.props.onKeyDown?.(e);
        },
        onPaste: (e: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const paste = e.clipboardData.getData("text");
            if (atMax || currentLength + paste.length > maxLength) {
                showHint();
            }
            child.props.onPaste?.(e);
        },
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const prev = String(child.props.value ?? value ?? "");
            const next = e.target.value;
            if (next.length === maxLength && prev.length < maxLength) {
                showHint(next.length);
            }
            child.props.onChange?.(e);
        },
    });

    return (
        <div ref={wrapRef} className={cn("w-full min-w-0", className)}>
            <TooltipDisplayer
                open={open}
                onOpenChange={(next: boolean) => {
                    if (!next) setOpen(false);
                }}
                tooltip={open ? tooltip : undefined}
                side="top"
                container={portalContainer}
                contentClassName={portalContainer ? "z-[100]" : undefined}
            >
                {wrapped}
            </TooltipDisplayer>
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/formMaxLengthControl.tsx"),
)(FormMaxLengthControl);
