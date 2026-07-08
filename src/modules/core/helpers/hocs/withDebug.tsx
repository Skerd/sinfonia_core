import {useMemo, useState} from "react";
import {
    BicepsFlexed,
    BrushCleaning,
    CircleCheckBig,
    CircleOff,
    EyeOff,
    Fingerprint,
    Languages,
    LoaderCircle,
    Rss,
    ShieldQuestionMark,
    Shredder
} from "lucide-react";
import {toast} from "sonner";
import CopyTooltip from "@coreModule/components/custom/copyTooltip.tsx";
import {Popover, PopoverContent, PopoverTrigger} from "@coreModule/components/ui/popover.tsx";
import {Card} from "@coreModule/components/ui/card.tsx";
import {Toggle} from "@coreModule/components/ui/toggle.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

type ResolveKey = (key: string, returnUndefinedIfNeeded?: boolean) => unknown;

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Mirrors `useHttpRequest.configureToast` error formatting for debug previews. */
function formatAxiosDebugErrorMessage(requestError: unknown, resolveLanguageKey?: ResolveKey): string {
    let message = String(resolveLanguageKey?.("axios.error.title") ?? "");
    const err = isPlainObject(requestError) ? requestError : {};
    let serverError = String((err.message as string | undefined) ?? "");
    if (!!err.extraMessage) {
        serverError = serverError + " [ " + String(err.extraMessage) + " ]";
    }
    if (!!serverError) {
        message = (!!message ? (message + ": ") : "") + serverError;
    }
    return message || "Error";
}

function pushWithAxiosToastPreview(props: Record<string, any>, variant: "loading" | "success" | "error") {
    const http = props.withAxios?.httpRequest;
    if (!http) {
        return;
    }
    const rk = props.resolveLanguageKey as ResolveKey | undefined;

    if (variant === "loading") {
        if (!rk?.("axios.start", true)) {
            return;
        }
        toast.loading(String(rk("axios.start.title") ?? ""));
        return;
    }

    if (variant === "success") {
        if (!rk?.("axios.success", true)) {
            return;
        }
        let messageToReturn = String(rk("axios.success.title") ?? "");
        if (http.onSuccessMessage) {
            const successData: Record<string, unknown> = {_debugSample: true};
            if (successData[http.onSuccessMessage.if] === http.onSuccessMessage.condition) {
                messageToReturn = String(
                    rk(`axios.${http.onSuccessMessage.message}.title`) ?? messageToReturn,
                );
            }
        }
        toast.success(messageToReturn);
        return;
    }

    if (!rk?.("axios.error", true)) {
        return;
    }
    const errPayload = {
        message: "Debug sample server message",
        extraMessage: "withDebug",
        status: 400,
    };
    toast.error(formatAxiosDebugErrorMessage(errPayload, rk));
}

/**
 * Optional metadata injected by other core HOCs and consumed by this debug layer.
 * This is intentionally permissive because each screen can compose a different set of HOCs.
 */
type DebuggableProps = Record<string, any>;

/**
 * Wraps a component with development-only debug controls.
 *
 * Behavior:
 * - In non-localhost environments (or when `hideDebug=true`), returns the original component
 *   without any additional wrapper/hook overhead.
 * - In localhost, injects a compact debug toolbar and allows simulating loading/error/empty states.
 *
 * @param checked indicates whether all expected HOCs are already wired (visual ratio/check indicator).
 * @param hideDebug force-disables debug UI even on localhost.
 */
const withDebug = (checked?: boolean, hideDebug: boolean = false) => (WrappedComponent: any) => {

    const showDebugInfo = typeof window !== "undefined" && window.location?.host?.includes("localhost") && !hideDebug;

    // In non-debug environments, skip all wrapper state/hooks entirely.
    if (!showDebugInfo) {
        return WrappedComponent;
    }

    /**
     * Debug-enhanced component rendered only when `showDebugInfo` is true.
     * Avoiding this component in production keeps render tree and runtime cost unchanged.
     */
    function EnhancedComponent_WithDebug(props: DebuggableProps) {

        const ratio = useMemo(() => {
            let ratio = checked ? 1 : 0;
            if (props.withLanguage) {
                ratio++;
            }
            if (props.withAxios) {
                ratio++;
            }
            if (props.withClearance) {
                ratio++;
            }
            if (props.withAccess) {
                ratio++;
            }
            if (props.withHidden) {
                ratio++;
            }
            return `${ratio}/5`;
        }, [checked, props.withAccess, props.withAxios, props.withClearance, props.withHidden, props.withLanguage]);
        const size = 16;

        // Local toggles to test failure/loading/empty UI branches without backend changes.
        const [testLoadings, setTestLoadings] = useState<boolean>(false);
        const [testError, setTestError] = useState<boolean>(false);
        const [testEmptyData, setTestEmptyData] = useState<boolean>(false);
        const [forceReloadData, setForceReloadData] = useState<number>(0);

        const rkToast = props.resolveLanguageKey as ResolveKey | undefined;
        const showAxiosToastLoading = !!rkToast?.("axios.start", true);
        const showAxiosToastSuccess = !!rkToast?.("axios.success", true);
        const showAxiosToastError = !!rkToast?.("axios.error", true);
        const hasAxiosToastLanguageBlocks =
            showAxiosToastLoading || showAxiosToastSuccess || showAxiosToastError;

        return (
            <>
                {
                    (!checked) &&
                    <div
                        className="flex items-center space-x-0.5 z-10 px-0.5 py-1 border bg-muted rounded-lg text-xs"
                        // onMouseEnter={() => {setSize(24);}}
                        // onMouseLeave={() => {setSize(12);}}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                        }}
                    >
                        {
                            !checked ?
                                <div className="text-[10px]/[8px] font-bold cursor-default opacity-100">
                                    {ratio}
                                </div>
                                :
                                <CircleCheckBig color="green" size={size} className="top-0"/>
                        }
                        {
                            props.withHidden &&
                            <EyeOff size={size}/>
                        }
                        {
                            props.withLanguage &&
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Languages size={size}
                                               className="top-0 opacity-100 hover:cursor-pointer hover:text-muted-foreground"/>
                                </PopoverTrigger>
                                <PopoverContent asChild>
                                    <Card className="flex items-center gap-2 w-fit">
                                        <div
                                            className="grid grid-rows-2 grid-cols-[100px_1fr] gap-0 h-full w-full text-xs">
                                            <p>languageCode:</p>
                                            <p className="font-semibold">{props.withLanguage?.languageCode}</p>

                                            <p>path:</p>
                                            <div className="flex items-center space-x-1">
                                                <span className="font-semibold">{props.withLanguage?.path}</span>
                                                <CopyTooltip text={props.withLanguage?.path}/>
                                            </div>
                                        </div>
                                    </Card>
                                </PopoverContent>
                            </Popover>
                        }
                        {
                            props.withAxios &&
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Rss size={size}
                                         className="top-0 opacity-100 hover:cursor-pointer hover:text-muted-foreground"/>
                                </PopoverTrigger>
                                <PopoverContent asChild>
                                    <Card
                                        className="flex flex-col items-center gap-2 w-auto max-w-md max-h-[600px] overflow-y-auto">
                                        <div className="text-xs w-full">
                                            <p className="font-semibold mb-1">HTTP Request:</p>
                                            <pre className="text-[10px] overflow-x-auto">
                                                {JSON.stringify({
                                                    ...props.withAxios.httpRequest,
                                                    data: props?.getLatestFormData?.() || props.withAxios.httpRequest.data
                                                }, null, 2)}
                                            </pre>
                                            <p className="mt-1">childPost: {props.withAxios.childPost ? "true" : "false"}</p>
                                        </div>

                                        {/* Infinite Scroll Debug Info */}
                                        {
                                            (props.accumulatedItems !== undefined || props.infiniteScrollPage !== undefined) &&
                                            <div className="text-xs w-full border-t pt-2 mt-2">
                                                <p className="font-semibold mb-1">Infinite Scroll State:</p>
                                                <div className="grid grid-cols-2 gap-1 text-[10px]">
                                                    <p>Accumulated Items:</p>
                                                    <p className="font-semibold">{props.accumulatedItems?.length || 0}</p>
                                                    <p>Current Page:</p>
                                                    <p className="font-semibold">{props.infiniteScrollPage || 1}</p>
                                                    <p>Total Items:</p>
                                                    <p className="font-semibold">{props.infiniteScrollTotal || 0}</p>
                                                    <p>Has More Data:</p>
                                                    <p className={cn("font-semibold", props.infiniteScrollHasMoreData ? "text-green-500" : "text-muted-foreground")}>
                                                        {props.infiniteScrollHasMoreData ? "Yes" : "No"}
                                                    </p>
                                                    <p>Is Ready:</p>
                                                    <p className={cn("font-semibold", props.infiniteScrollIsReady ? "text-green-500" : "text-muted-foreground")}>
                                                        {props.infiniteScrollIsReady ? "Yes" : "No"}
                                                    </p>
                                                    <p>Limit:</p>
                                                    <p className="font-semibold">{props.infiniteScrollLimit || "N/A"}</p>
                                                </div>
                                            </div>
                                        }

                                        {/* Current State Indicator */}
                                        <div className="text-xs w-full border-t pt-2 mt-2">
                                            <p className="font-semibold mb-1">Current State:</p>
                                            <div className="flex flex-wrap gap-1">
                                                <span
                                                    className={cn("px-2 py-0.5 rounded text-[10px]", props.error || testError ? "bg-red-500 text-white" : "bg-muted")}>
                                                    {props.error || testError ? "Error" : "No Error"}
                                                </span>
                                                <span
                                                    className={cn("px-2 py-0.5 rounded text-[10px]", props.loading || testLoadings ? "bg-blue-500 text-white" : "bg-muted")}>
                                                    {props.loading || testLoadings ? "Loading" : "Not Loading"}
                                                </span>
                                                <span
                                                    className={cn("px-2 py-0.5 rounded text-[10px]", (!props.data || testEmptyData) && !props.accumulatedItems?.length ? "bg-yellow-500 text-white" : "bg-muted")}>
                                                    {(!props.data || testEmptyData) && !props.accumulatedItems?.length ? "No Data" : "Has Data"}
                                                </span>
                                                {props.accumulatedItems !== undefined && (
                                                    <span
                                                        className={cn("px-2 py-0.5 rounded text-[10px]", props.accumulatedItems.length > 0 ? "bg-green-500 text-white" : "bg-muted")}>
                                                        {props.accumulatedItems.length} Items
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-1 items-center w-full border-t pt-2 mt-2">
                                            <Toggle
                                                aria-label="Toggle test loading"
                                                size="sm"
                                                variant="outline"
                                                className="data-[state=on]:bg-transparent hover:cursor-pointer text-xs gap-0.5 items-center flex"
                                                onClick={() => {
                                                    setTestLoadings(!testLoadings);
                                                }}
                                            >
                                                <LoaderCircle
                                                    className={cn(props.loading || testLoadings ? "animate-spin" : "")}/>
                                                <p>{props.loading ? "Loading..." : (!testLoadings ? "Test loading" : "Loading...")}</p>
                                            </Toggle>
                                            <Toggle
                                                aria-label="Toggle test error"
                                                size="sm"
                                                variant="outline"
                                                className="data-[state=on]:bg-transparent hover:cursor-pointer text-xs gap-0.5 items-center flex"
                                                onClick={() => {
                                                    setTestError(!testError);
                                                }}
                                            >
                                                <CircleOff
                                                    className={cn(props.error || testError ? "text-red-500" : "")}/>
                                                <p>{!testError ? "Test error" : "Error!"}</p>
                                            </Toggle>
                                            <Toggle
                                                aria-label="Toggle test empty data"
                                                size="sm"
                                                variant="outline"
                                                className="data-[state=on]:bg-transparent hover:cursor-pointer text-xs gap-0.5 items-center flex"
                                                onClick={() => {
                                                    setTestEmptyData(!testEmptyData);
                                                }}
                                            >
                                                <BrushCleaning className={cn(testEmptyData ? "text-red-500" : "")}/>
                                                <p>{!props.data && !props.accumulatedItems?.length ? "No data!" : (!testEmptyData ? "Test no data" : "No data!")}</p>
                                            </Toggle>
                                            {
                                                !!props.justForceRefresh &&
                                                <Toggle
                                                    aria-label="Toggle test force data fetch"
                                                    size="sm"
                                                    variant="outline"
                                                    className="data-[state=on]:bg-transparent hover:cursor-pointer text-xs gap-0.5 items-center flex"
                                                    onClick={() => {
                                                        if (!!props.justForceRefresh) {
                                                            props.justForceRefresh();
                                                        }
                                                        setForceReloadData((previousValue) => previousValue + 1);
                                                    }
                                                    }
                                                >
                                                    <BicepsFlexed
                                                        className={cn(forceReloadData > 0 ? "text-green-500" : "")}/>
                                                    <p>Reloaded: {forceReloadData} times</p>
                                                </Toggle>
                                            }
                                        </div>

                                        {hasAxiosToastLanguageBlocks && props.withAxios && (
                                        <div className="w-full border-t pt-2 mt-2 space-y-2">
                                            <p className="text-xs font-semibold w-full">
                                                Toast previews (useHttpRequest / withAxios)
                                            </p>
                                            <p className="text-[10px] text-muted-foreground w-full leading-snug">
                                                Sonner toasts only — same <code className="text-[10px]">axios.*.title</code>{" "}
                                                copy as <code className="text-[10px]">useHttpRequest</code>{" "}
                                                <code className="text-[10px]">toast.promise</code>.
                                            </p>
                                            <div className="flex flex-wrap gap-1 w-full">
                                                {showAxiosToastLoading && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-[10px] px-2"
                                                    onClick={() => pushWithAxiosToastPreview(props, "loading")}
                                                >
                                                    Test loading toast
                                                </Button>
                                                )}
                                                {showAxiosToastSuccess && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-[10px] px-2"
                                                    onClick={() => pushWithAxiosToastPreview(props, "success")}
                                                >
                                                    Test success toast
                                                </Button>
                                                )}
                                                {showAxiosToastError && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-[10px] px-2"
                                                    onClick={() => pushWithAxiosToastPreview(props, "error")}
                                                >
                                                    Test error toast
                                                </Button>
                                                )}
                                            </div>
                                        </div>
                                        )}
                                    </Card>
                                </PopoverContent>
                            </Popover>
                        }
                        {
                            props.withClearance &&
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Fingerprint size={size}
                                                 className="top-0 opacity-100 hover:cursor-pointer hover:text-muted-foreground"/>
                                </PopoverTrigger>
                                <PopoverContent asChild>
                                    <Card className="flex items-center gap-2 w-fit">
                                        <div
                                            className="grid grid-rows-2 grid-cols-[140px_1fr] gap-0 h-full w-full text-xs">
                                            <p>Clearance Level:</p>
                                            <p className="font-semibold">{props.withClearance?.clearanceLevel}</p>
                                            <p>Requires all:</p>
                                            <p className="font-semibold">{props.withClearance?.atLeastOnePermission ? "false" : "true"}</p>
                                            <p>Self Permissions:</p>
                                            <p className={cn("font-semibold", {
                                                "text-green-500": !props.withClearance?.ifPropValue,
                                                "text-muted-foreground": !!props.withClearance.ifPropValue
                                            })}>[{props.withClearance?.permissions.join(", ")}]</p>
                                            <p>Others Permissions:</p>
                                            <p className={cn("font-semibold", {
                                                "text-green-500": !!props.withClearance?.ifPropValue,
                                                "text-muted-foreground": !props.withClearance.ifPropValue
                                            })}>[{props.withClearance?.otherPermissions.join(", ")}]</p>
                                            <p>Error-Render:</p>
                                            <p className="font-semibold">{props.withClearance?.renderComponentOnError ? "true" : "false"}</p>
                                            <p>In behalf of:</p>
                                            <div className="flex items-center space-x-1">
                                                <span
                                                    className="font-semibold">{props.withClearance.ifPropValue || "-"}</span>
                                                {
                                                    !!props.withClearance.ifPropValue &&
                                                    <CopyTooltip text={props.withClearance.ifPropValue}/>
                                                }
                                            </div>
                                            <p className="font-semibold"></p>
                                        </div>
                                    </Card>
                                </PopoverContent>
                            </Popover>
                        }

                        {
                            props.withResourceAccess &&
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Shredder size={size}
                                              className="top-0 opacity-100 hover:cursor-pointer hover:text-muted-foreground text-destructive"/>
                                </PopoverTrigger>
                                <PopoverContent asChild>
                                    <Card className="flex items-center gap-2 w-fit">
                                        <div
                                            className="grid grid-rows-2 grid-cols-[140px_1fr] gap-0 h-full w-full text-xs">
                                            <p>Resource:</p>
                                            <p className="font-semibold">{props.withResourceAccess?.resourceId}</p>
                                            <p>Action:</p>
                                            <p className="font-semibold">{props.withResourceAccess?.action}</p>
                                            <p className="col-span-2">
                                                <pre>
                                                    {JSON.stringify(props.withResourceAccess?.resource, null, 2)}
                                                </pre>
                                            </p>
                                            <p>In behalf of:</p>
                                            <div className="flex items-center space-x-1">
                                                <span
                                                    className="font-semibold">{props.withResourceAccess.ifPropValue || "-"}</span>
                                                {
                                                    !!props.withResourceAccess.ifPropValue &&
                                                    <CopyTooltip text={props.withResourceAccess.ifPropValue}/>
                                                }
                                            </div>
                                            <p>Error-Render:</p>
                                            <p className="font-semibold">{props.withResourceAccess?.renderComponentOnError ? "true" : "false"}</p>
                                        </div>
                                    </Card>
                                </PopoverContent>
                            </Popover>
                        }

                        {
                            props.withAccess &&
                            <Popover>
                                <PopoverTrigger asChild>
                                    <ShieldQuestionMark size={size}
                                                        className="top-0 opacity-100 hover:cursor-pointer hover:text-muted-foreground"/>
                                </PopoverTrigger>
                                <PopoverContent asChild>
                                    <Card className="flex items-center gap-2 w-fit">
                                        <div
                                            className="grid grid-rows-2 grid-cols-[140px_1fr] gap-0 h-full w-full text-xs">
                                            <p>Resource:</p>
                                            <p className="font-semibold">{props.withAccess?.resourceId}</p>
                                            <p>In behalf of:</p>
                                            <div className="flex items-center space-x-1">
                                                <span
                                                    className="font-semibold">{props.withAccess.ifPropValue || "-"}</span>
                                                {
                                                    !!props.withAccess.ifPropValue &&
                                                    <CopyTooltip text={props.withAccess.ifPropValue}/>
                                                }
                                            </div>
                                            <p>Error-Render:</p>
                                            <p className="font-semibold">{props.withAccess?.renderComponentOnError ? "true" : "false"}</p>
                                            <p>Create:</p>
                                            <p className="font-semibold">{props.withAccess?.create ? "true" : "false"}</p>
                                            <p>Delete:</p>
                                            <p className="font-semibold">{props.withAccess?.delete ? "true" : "false"}</p>
                                            <p>Read:</p>
                                            <p className="col-span-2 font-semibold">
                                                <pre>
                                                    {JSON.stringify(props.withAccess?.read, null, 2)}
                                                </pre>
                                            </p>
                                            <p>Write:</p>
                                            <p className="col-span-2 font-semibold">
                                                <pre>
                                                    {JSON.stringify(props.withAccess?.write, null, 2)}
                                                </pre>
                                            </p>
                                        </div>
                                    </Card>
                                </PopoverContent>
                            </Popover>
                        }
                    </div>
                }
                <WrappedComponent
                    {...props}
                    loading={props.loading || testLoadings}
                    error={props.error || testError}
                    data={testEmptyData ? null : props.data}
                />
            </>
        )
    }

    return EnhancedComponent_WithDebug;
}

export default withDebug;
