import {AlertCircle} from "lucide-react";
import {HttpError} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {Countdown} from "@coreModule/components/custom/countdown.tsx";
import {Alert, AlertDescription, AlertTitle} from "@coreModule/components/ui/alert.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import {useState} from "react";
import type {ResolveLanguageKey, TranslationValue} from "@coreModule/helpers/hocs/withLanguage.tsx";

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
                    <Alert variant="destructive" className="cursor-pointer w-auto border-2 border-red-600" >
                        <AlertCircle/>
                        <AlertTitle>{error.message}</AlertTitle>
                        <AlertDescription>
                            <div className="flex items-center space-x-1">
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

    const tooltipText = typeof (tooltipDescription ?? description) === "string" ? (tooltipDescription ?? description) as string : String(description);
    return (
        <TooltipDisplayer tooltip={tooltipText}>
            <Alert variant="destructive" className="cursor-pointer w-auto border-2 border-red-600" onClick={(e) => {e.stopPropagation(); e.preventDefault(); setCanRetry(true); onClick();}}>
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
