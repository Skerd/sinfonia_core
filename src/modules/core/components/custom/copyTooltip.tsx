import { useState, type ReactNode } from "react"
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {CopyButton} from "@coreModule/components/animate-ui/components/buttons/copy.tsx";
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";

type CopyTooltipProps = WithLanguageType & {
    text: string
    duration?: number
    children?: ReactNode
}

function CopyTooltip({
    text,
    children,
    resolveLanguageKey
}: CopyTooltipProps) {

    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    return (
        <TooltipDisplayer tooltipRender={() => { return <p>{resolveLanguageKey( copied ? "copied" : "copy")}</p> }} open={open} onOpenChange={(v: boolean) => setOpen(v)}>
            <div className="flex items-center gap-x-1 hover:underline hover:cursor-pointer">
                {!!children && children}
                <CopyButton
                    size={"xs"}
                    variant="ghost"
                    content={text}
                    onClick={(e) => {e.stopPropagation();}}
                    onCopiedChange={(value) => {
                        setCopied(value);
                        if (value) setOpen(true);
                    }}
                />
            </div>
        </TooltipDisplayer>
    )
}

export default withLanguage("src/modules/core/components/custom/copyTooltip.tsx")(CopyTooltip);