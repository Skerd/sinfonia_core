import {Separator} from "@coreModule/components/ui/separator.tsx";

type SimpleHeaderProps = {
    title: string,
    description: string,
    children?: any
}

export default function Header({
    title,
    description,
    children
}: SimpleHeaderProps) {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between space-x-1">
                <div className="flex-1">
                    <p className='text-lg md:text-xl font-bold tracking-tighter'>{title}</p>
                    <p className='text-sm md:text-base text-muted-foreground'>{description}</p>
                </div>
                {children}
            </div>
            <Separator className='shadow-sm' />
        </div>
    )
}