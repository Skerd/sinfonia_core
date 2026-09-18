import {AlertCircle} from "lucide-react";
import {HttpError} from "@baseModule/helpers/hooks/useHttpRequest.ts";
import {Countdown} from "@baseModule/components/custom/countdown.tsx";
import {Alert, AlertDescription, AlertTitle} from "@coreModule/components/ui/alert.tsx";
import TooltipDisplayer from "@baseModule/components/custom/tooltipDisplayer.tsx";
import {useState} from "react";
import type {ResolveLanguageKey, TranslationValue} from "@baseModule/helpers/hocs/withLanguage.tsx";

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

    const [canRetry, setCanRetry] = useState(false);

    if( !!error && error.error_code === "rate_limit_exceeded" ){
        return (
            <>
                {
                    !canRetry ?
                    <Alert variant="destructive" className="cursor-pointer w-auto border-2 border-destructive" >
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
                    <Alert variant="warning" className="cursor-pointer w-auto border-2" onClick={(e) => {e.stopPropagation(); e.preventDefault(); setCanRetry(false); onClick();}}>
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
            <Alert variant="destructive" className="cursor-pointer w-auto border-2 border-destructive" onClick={(e) => {e.stopPropagation(); e.preventDefault(); setCanRetry(true); onClick();}}>
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
