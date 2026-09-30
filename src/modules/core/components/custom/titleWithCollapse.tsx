import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "@coreModule/components/animate-ui/primitives/radix/collapsible.tsx"
import {CardDescription, CardTitle} from "@coreModule/components/ui/card.tsx";
import TruncatedValue from "@coreModule/components/viewEngine/widgets/display/truncatedValue.tsx";
import {ChevronDown} from "lucide-react";
import {ReactNode, useState} from "react";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Separator} from "@coreModule/components/ui/separator.tsx";
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
        <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
                <div className="hover:cursor-pointer flex flex-col gap-2">
                    <div className="flex items-center">
                        {/*
                          * min-w-0 lets this flex item shrink below its content's natural
                          * width; without it a flex row never bounds the box, so `truncate`
                          * below has nothing to clip against and text just overflows instead.
                          */}
                        <div className='min-w-0 flex-1'>
                            <CardTitle className={cn({"text-destructive": danger})}>
                                <TruncatedValue text={typeof title === "string" ? title : ""}>
                                    {title}
                                </TruncatedValue>
                            </CardTitle>
                            <CardDescription className={cn({"text-destructive": danger})}>
                                <TruncatedValue text={typeof description === "string" ? description : ""}>
                                    {description}
                                </TruncatedValue>
                            </CardDescription>
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
                    <Separator />
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="p-2">
                    <div className="flex flex-col gap-4 border-s-2 border-dashed border-primary/15 ps-2 md:ps-4 pt-2">
                        {children}
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}
