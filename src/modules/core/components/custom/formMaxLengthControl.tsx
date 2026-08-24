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
    children: ReactNode;
};

function FormMaxLengthControl({
    maxLength,
    value,
    children,
    resolveLanguageKey,
}: FormMaxLengthControlProps) {
    const [open, setOpen] = useState(false);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const wrapped = cloneElement(child, {
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
        <TooltipDisplayer
            open={open}
            onOpenChange={(next: boolean) => {
                // Only programmatic showHint opens the tooltip; ignore hover/focus.
                if (!next) setOpen(false);
            }}
            tooltip={open ? tooltip : undefined}
            side="top"
        >
            {wrapped}
        </TooltipDisplayer>
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/formMaxLengthControl.tsx"),
)(FormMaxLengthControl);
