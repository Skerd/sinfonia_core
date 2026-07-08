import { Separator } from '@coreModule/components/ui/separator.tsx'
import {JSX} from "react";

type ContentSectionProps = {
  title: string
  desc: string
  children: JSX.Element
}

export function ContentSection({ title, desc, children }: ContentSectionProps) {
  return (
    <div className='flex flex-1 flex-col'>
      <div className='flex-none'>
        <h3 className='flex items-center space-x-1.5 text-lg font-medium'>{title}</h3>
        <p className='text-muted-foreground text-sm'>{desc}</p>
      </div>
      <Separator className='my-4 flex-none' />
      <div className='faded-bottom h-full w-full overflow-y-auto scroll-smooth pb-12' style={{border: "0px solid blue"}}>
        <div className='mx-0 px-1.5 lg:max-w-4xl'>{children}</div>
      </div>
    </div>
  )
}
