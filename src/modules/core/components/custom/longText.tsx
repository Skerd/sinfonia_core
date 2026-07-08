import {useRef, useState} from 'react'
import {cn} from "@coreModule/components/lib/utils.ts"
import {Popover, PopoverContent, PopoverTrigger} from '@coreModule/components/ui/popover.tsx'
import TooltipDisplayer from "@coreModule/components/custom/tooltipDisplayer.tsx";
import withVisibility, {VisibilityProps} from "@coreModule/helpers/hocs/withVisibility.tsx";
import {compose} from "redux";

type LongTextProps = VisibilityProps & {
    children: React.ReactNode
    className?: string
    contentClassName?: string
}

export function LongText({
    children,
    className = '',
    contentClassName = ' wrap-break-word',
}: LongTextProps) {

    const ref = useRef<HTMLDivElement>(null)
    const [isOverflown, setIsOverflown] = useState(false)

    // Use ref callback to check overflow when element is mounted
    const refCallback = (node: HTMLDivElement | null) => {
        ref.current = node
        if (node && checkOverflow(node)) {
            queueMicrotask(() => setIsOverflown(true))
        }
    }

    if (!isOverflown){
        return (
            <div ref={refCallback} className={cn('truncate', className)}>
                {children}
            </div>
        )
    }

    const renderPopover = () => {
        return (
            <div className="max-w-sm max-h-72 min-w-0 overflow-y-auto overflow-x-hidden">
                <pre className="max-w-full whitespace-pre-wrap wrap-break-word">{children}</pre>
            </div>
        )
    }

    return (
        <>
            <div className='hidden sm:block' onClick={(e) => e.stopPropagation()}>
                <TooltipDisplayer tooltipRender={renderPopover}>
                    <div ref={refCallback} className={cn('truncate hover:cursor-pointer', className)}>
                        {children}
                    </div>
                </TooltipDisplayer>
            </div>
            <div className='sm:hidden'>
                <Popover>
                    <PopoverTrigger asChild>
                        <div ref={refCallback} className={cn('truncate', className)} onClick={(e) => e.stopPropagation()}>
                            {children}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className={cn('w-fit', contentClassName)}>
                        {renderPopover()}
                    </PopoverContent>
                </Popover>
            </div>
        </>
    )
}

const checkOverflow = (textContainer: HTMLDivElement | null) => {
    if (textContainer) {
        return (
            textContainer.offsetHeight < textContainer.scrollHeight ||
            textContainer.offsetWidth < textContainer.scrollWidth
        )
    }
    return false
}

export default compose(
    withVisibility()
)(LongText)
