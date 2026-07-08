import {Collapsible, CollapsibleContent, CollapsibleTrigger,} from "@coreModule/components/ui/collapsible.tsx"
import {ChevronDown, ChevronUp} from "lucide-react";
import {ReactNode, useEffect, useState} from "react";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Separator} from "@coreModule/components/ui/separator.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";

export default function TitleWithCollapse({children, title, description, inBetween, defaultOpen = true, danger = false, forceOpen = 0}: {title: string | any, description?: string | any, inBetween?: ReactNode, children: any, defaultOpen?: boolean, danger?: boolean, forceOpen?: number}){

    const [open, setOpen] = useState(defaultOpen);

    useEffect(() => {
        if( !!forceOpen ){
            setOpen(true);
        }
    }, [forceOpen]);

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
        >
            <CollapsibleTrigger asChild>
                <div className={`${open ? "" : ""} hover:cursor-pointer space-y-2`}>
                    <div className="flex items-center">
                        <div className='flex-none grow'>
                            <h3 className={cn('flex items-center space-x-1.5 text-md font-medium', {"text-destructive": danger})}>
                                {title}
                            </h3>
                            <p className={cn('text-muted-foreground text-sm', {"text-destructive": danger})}>{description}</p>
                        </div>
                        {!!inBetween && inBetween}
                        <Button type={"button"} className="" variant="ghost" size="icon">
                            {
                                open ?
                                <ChevronUp className={cn("h-4 w-4", {"text-destructive": danger})} />
                                :
                                <ChevronDown className={cn("h-4 w-4", {"text-destructive": danger})} />
                            }
                        </Button>
                    </div>
                    <Separator />
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="mt-4 ps-2">
                    <div className="flex flex-col gap-4 border-s-2 border-dashed border-primary/15 ps-2 md:ps-4">
                        {children}
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}