import {isValidElement, ReactNode, useEffect, useRef, useState, useSyncExternalStore} from "react";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@coreModule/components/animate-ui/components/animate/tooltip.tsx";
import {useTooltipProviderPresent} from "@coreModule/components/animate-ui/primitives/animate/tooltip.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

type TooltipDisplayerProps = {
    children: ReactNode;
    tooltip?: string | number | boolean | null | undefined;
    tooltipRender?: () => ReactNode;
    contentClassName?: string;
    side?: "top" | "right" | "bottom" | "left";
    open?: boolean,
    onOpenChange?: (open: boolean) => void
    container?: HTMLElement | null
    disablePortal?: boolean
};

type TooltipContentStore = {
    node: ReactNode;
    listeners: Set<() => void>;
};

function subscribeTooltipContent(store: TooltipContentStore, listener: () => void) {
    store.listeners.add(listener);
    return () => {
        store.listeners.delete(listener);
    };
}

function readTooltipContent(store: TooltipContentStore) {
    return store.node;
}

function TooltipLiveContent({store}: {store: TooltipContentStore}) {
    const node = useSyncExternalStore(
        (listener) => subscribeTooltipContent(store, listener),
        () => readTooltipContent(store),
        () => readTooltipContent(store),
    );
    return node;
}

function TooltipDisplayerBody({
    children,
    tooltip,
    tooltipRender,
    contentClassName,
    side = "top",
    open,
    onOpenChange,
    container,
    disablePortal,
}: TooltipDisplayerProps) {
    const storeRef = useRef<TooltipContentStore | null>(null);
    if (!storeRef.current) {
        storeRef.current = {node: null, listeners: new Set()};
    }
    const store = storeRef.current;

    const [portalHost, setPortalHost] = useState<HTMLDivElement | null>(null);
    const tooltipStr = tooltip != null && tooltip !== "" ? String(tooltip) : "";
    const hasContent = !!tooltipRender || tooltipStr !== "";
    store.node = hasContent
        ? (tooltipRender ? tooltipRender() : <p className="text-sm">{tooltipStr}</p>)
        : null;

    useEffect(() => {
        store.listeners.forEach((listener) => listener());
    });

    if (!hasContent) {
        return <>{children}</>;
    }

    const portalRoot = disablePortal ? portalHost : container ?? null;
    const tooltipTree = (
        <Tooltip
            side={side}
            open={open}
            onOpenChange={onOpenChange}
            container={portalRoot}
        >
            <TooltipTrigger asChild>
                {isValidElement(children) ? children : <span>{children}</span>}
            </TooltipTrigger>
            <TooltipContent className={cn(contentClassName)}>
                <TooltipLiveContent store={store} />
            </TooltipContent>
        </Tooltip>
    );

    if (disablePortal) {
        return (
            <div ref={setPortalHost} className="contents">
                {tooltipTree}
            </div>
        );
    }

    return tooltipTree;
}

export function TooltipDisplayer(props: TooltipDisplayerProps) {
    const hasProvider = useTooltipProviderPresent();
    if (hasProvider) {
        return <TooltipDisplayerBody {...props} />;
    }
    return (
        <TooltipProvider>
            <TooltipDisplayerBody {...props} />
        </TooltipProvider>
    );
}

export default TooltipDisplayer;
