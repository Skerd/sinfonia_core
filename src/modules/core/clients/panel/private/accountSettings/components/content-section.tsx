import { Separator } from '@coreModule/components/ui/separator.tsx'
import {JSX} from "react";
import {cn} from "@coreModule/components/lib/utils.ts";

type ContentSectionProps = {
  title: string
  desc: string
  children: JSX.Element,
    childrenClassName?: string
}

export function ContentSection({ title, desc, children, childrenClassName }: ContentSectionProps) {
  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='flex-none'>
        <h3 className='flex items-center gap-x-1.5 text-lg font-medium'>{title}</h3>
        <p className='text-muted-foreground text-sm'>{desc}</p>
      </div>
      <Separator className='my-4 flex-none' />
      <div className='faded-bottom min-h-0 w-full flex-1 overflow-y-auto scroll-smooth pb-12'>
        <div className={cn('mx-0 px-1.5 lg:max-w-4xl', childrenClassName)}>{children}</div>
      </div>
    </div>
  )
}
