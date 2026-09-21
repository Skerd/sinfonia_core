import {AlertCircle} from "lucide-react";
import {HttpError} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {Countdown} from "@coreModule/components/custom/countdown.tsx";
import {Alert, AlertDescription, AlertTitle} from "@coreModule/components/ui/alert.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {useEffect, useState} from "react";
import type {KeyboardEvent, MouseEvent} from "react";
import type {ResolveLanguageKey, TranslationValue} from "@coreModule/helpers/hocs/withLanguage.tsx";

/** Fires `action` on click or on Enter/Space, so alerts acting as retry buttons stay keyboard-usable. */
function asActivation(action: () => void) {
    return {
        role: "button" as const,
        tabIndex: 0,
        onClick: (e: MouseEvent) => {e.stopPropagation(); e.preventDefault(); action();},
        onKeyDown: (e: KeyboardEvent) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.stopPropagation(); e.preventDefault(); action();
        },
    };
}

export type ErrorViewProps = {
    title: TranslationValue,
    description?: TranslationValue,
    tooltipDescription?: TranslationValue,
    onClick?: () => void,
    reasons?: string[],
    error?: HttpError,
    resolveLanguageKey?: ResolveLanguageKey
}

export function ErrorView({
    title,
    description,
    tooltipDescription,
    onClick = () => {},
    reasons,
    error,
    resolveLanguageKey = () => ""
}: ErrorViewProps) {

    const isRateLimited = !!error && error.error_code === "rate_limit_exceeded";
    const [canRetry, setCanRetry] = useState(() => isRateLimited && (error!.availableIn ?? 0) <= 0);

    // Each new rate-limit error is a fresh object (see readErrorBody in useHttpRequest.ts), so keying
    // on `error` re-derives canRetry per cooldown instead of carrying a stale `true` into the next one.
    useEffect(() => {
        if (isRateLimited) setCanRetry((error!.availableIn ?? 0) <= 0);
    }, [error, isRateLimited]);

    if( isRateLimited ){
        return (
            <>
                {
                    !canRetry ?
                    <Alert variant="destructive" className="w-auto border-2 border-destructive">
                        <AlertCircle/>
                        <AlertTitle>{error.message}</AlertTitle>
                        <AlertDescription>
                            <div className="flex items-center gap-x-1">
                                <div>{resolveLanguageKey("waitLimit")}</div>
                                <Countdown seconds={error.availableIn ?? 0} onComplete={() => {setCanRetry(true);}}/>
                            </div>
                        </AlertDescription>
                    </Alert>
                    :
                    <Alert
                        variant="warning"
                        className="cursor-pointer w-auto border-2"
                        {...asActivation(() => {setCanRetry(false); onClick();})}
                    >
                        <AlertCircle/>
                        <AlertTitle>{resolveLanguageKey("waitFinished")}</AlertTitle>
                        <AlertDescription>
                            <p>{description}</p>
                        </AlertDescription>
                    </Alert>
                }
            </>
        )
    }

    // Only strings make a tooltip. The previous fallback was `String(description)`, which
    // rendered the literal text "undefined" whenever description was unset; TooltipDisplayer
    // renders its children bare when the tooltip is undefined, which is what we want here.
    const tooltipSource = tooltipDescription ?? description;
    const tooltipText = typeof tooltipSource === "string" && tooltipSource !== "" ? tooltipSource : undefined;
    return (
        <TooltipDisplayer tooltip={tooltipText}>
            <Alert
                variant="destructive"
                className="cursor-pointer w-auto border-2 border-destructive"
                {...asActivation(() => {setCanRetry(true); onClick();})}
            >
                <AlertCircle/>
                <AlertTitle>{title}</AlertTitle>
                <AlertDescription>
                    <p>{description}</p>
                    {
                        !!reasons && Array.isArray(reasons) &&
                        <ul className="list-inside list-disc text-sm">
                            {
                                reasons.map((reason, index) => {
                                    return (
                                        <li key={"error_reason_" + index + "_" + reason.toLowerCase()}>{reason}</li>
                                    )
                                })
                            }
                        </ul>
                    }
                </AlertDescription>
            </Alert>
        </TooltipDisplayer>
    )
}
