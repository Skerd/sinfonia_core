import {useState, type JSX, useEffect, HTMLAttributes} from 'react'
import { cn } from "@coreModule/components/lib/utils.ts"
import { buttonVariants } from '@coreModule/components/ui/button.tsx'
import { ScrollArea } from '@coreModule/components/ui/scroll-area.tsx'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@coreModule/components/ui/select.tsx'
import {useLocation, useNavigate} from "react-router-dom";

type SidebarNavProps = HTMLAttributes<HTMLElement> & {
    items: {
        href: string
        title: string
        icon: JSX.Element
    }[],
    specificUserId?: string,
    updateActiveTab?: Function,
    activeTab?: string
}

export function SidebarNav({
    className,
    items,
    updateActiveTab = () => {},
    activeTab,
    specificUserId,
    ...props
}: SidebarNavProps) {

    const { pathname } = useLocation()
    const navigate = useNavigate()
    const [val, setVal] = useState(!specificUserId ? pathname : activeTab);

    useEffect(() => {
        setVal(!specificUserId ? pathname : activeTab);
    }, [pathname, activeTab, specificUserId]);

    const handleSelect = (e: string) => {
        if( !specificUserId ){
            setVal(e);
            navigate(e);
        }
        else{
            updateActiveTab(e);
        }
    }

  return (
    <>
        <div className='p-1 md:hidden'>
            <Select value={val} onValueChange={handleSelect}>
                <SelectTrigger className='h-12 sm:w-48'>
                    <SelectValue placeholder='Theme'/>
                </SelectTrigger>
                <SelectContent>
                    {
                        items.map((item) => {
                            return (
                                <SelectItem key={item.href} value={item.href}>
                                    <div className='flex gap-x-4 px-2 py-1'>
                                        <span className='scale-125'>{item.icon}</span>
                                        <span className='text-md'>{item.title}</span>
                                    </div>
                                </SelectItem>
                            )
                        })
                    }
                </SelectContent>
            </Select>
        </div>

        <ScrollArea
            orientation='horizontal'
            type='always'
            className='bg-background hidden w-full min-w-40 md:block'
        >
            <nav className={cn('flex space-x-2 lg:flex-col lg:space-y-1 lg:space-x-0', className)} {...props}>
                {
                    items.map((item) => {
                        return (
                            <div
                                key={item.href}
                                onClick={() => { handleSelect(item.href) }}
                                className={cn(
                                    buttonVariants({ variant: 'ghost' }),
                                    (!specificUserId ? pathname : activeTab) === item.href
                                        ? 'bg-muted hover:bg-accent'
                                        : 'hover:bg-accent hover:underline',
                                    'justify-start hover:cursor-pointer'
                                )}
                            >
                                <span className='me-2'>{item.icon}</span>
                                {item.title}
                            </div>
                        )
                    }
                )}
            </nav>
        </ScrollArea>
    </>
  )
}
