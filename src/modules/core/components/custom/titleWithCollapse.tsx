import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@coreModule/components/animate-ui/primitives/radix/collapsible.tsx"
import {CardDescription, CardTitle} from "@coreModule/components/ui/card.tsx";
import TruncatedValue from "@coreModule/components/viewEngine/widgets/display/truncatedValue.tsx";
import {ChevronDown} from "lucide-react";
import {ReactNode, useState} from "react";
import {Button} from "@coreModule/components/ui/button.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

type TitleWithCollapseProps = {
    title: ReactNode,
    description?: ReactNode,
    inBetween?: ReactNode,
    children: ReactNode,
    defaultOpen?: boolean,
    danger?: boolean,
}

export default function TitleWithCollapse({children, title, description, inBetween, defaultOpen = true, danger = false}: TitleWithCollapseProps){

    const [open, setOpen] = useState(defaultOpen);

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className={cn(
                "flex flex-col gap-1 overflow-hidden rounded-xl bg-muted/40 text-sm text-card-foreground ring-1 ring-foreground/10",
                {"bg-destructive/5": danger},
            )}
        >
            <CollapsibleTrigger asChild>
                <div className="flex min-h-13 cursor-pointer items-center gap-2 px-4 py-2.5">
                    {/*
                      * min-w-0 lets this flex item shrink below its content's natural
                      * width; without it a flex row never bounds the box, so `truncate`
                      * below has nothing to clip against and text just overflows instead.
                      */}
                    <div className="min-w-0 flex-1">
                        <CardTitle className={cn("text-sm font-semibold leading-snug", {"text-destructive": danger})}>
                            <TruncatedValue text={typeof title === "string" ? title : ""}>
                                {title}
                            </TruncatedValue>
                        </CardTitle>
                        {description ? (
                            <CardDescription className={cn({"text-destructive": danger})}>
                                <TruncatedValue text={typeof description === "string" ? description : ""}>
                                    {description}
                                </TruncatedValue>
                            </CardDescription>
                        ) : null}
                    </div>
                    {!!inBetween && inBetween}
                    <Button type={"button"} variant="ghost" size="icon">
                        {/* One stable icon, rotated by CSS: swapping between two icon
                          * components on toggle would change the element type at this
                          * position, forcing React to unmount/remount the DOM node
                          * instead of just patching a class. */}
                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180", {"text-destructive": danger})} />
                    </Button>
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="flex flex-col gap-4 overflow-hidden rounded-lg bg-card p-4 ring-1 ring-foreground/5">
                    {children}
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}
