import {compose} from "redux";
import { cn } from "@coreModule/components/lib/utils.ts"
import { Check, Moon, Sun } from 'lucide-react'
import { Button } from '@coreModule/components/ui/button.tsx'
import { useTheme } from '@coreModule/helpers/context/providers/theme-provider.tsx'
import { useDensity } from '@coreModule/helpers/context/providers/density-provider.tsx'
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@coreModule/components/ui/dropdown-menu.tsx'

type ThemeSwitchProps = WithLanguageType & {
    showTitles?: boolean,
}

function ThemeSwitch({resolveLanguageKey, showTitles}: ThemeSwitchProps) {
    const { theme, setTheme } = useTheme()
    const { density, setDensity } = useDensity()

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size={showTitles ? "default" : "icon"}
                    className="hover:cursor-pointer gap-1"
                    aria-label={resolveLanguageKey("appearance")}
                >
                    <span className="relative flex items-center justify-center size-[1.2rem]">
                        <Sun className="size-[1.2rem] absolute inset-0 scale-100 rotate-0 opacity-100 transition-[transform,opacity] duration-300 dark:scale-0 dark:-rotate-90 dark:opacity-0" />
                        <Moon className="size-[1.2rem] absolute inset-0 scale-0 rotate-90 opacity-0 transition-[transform,opacity] duration-300 dark:scale-100 dark:rotate-0 dark:opacity-100" />
                    </span>
                    {showTitles && <p>{resolveLanguageKey(theme)}</p>}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className='size-4' />
                    {resolveLanguageKey("light")}
                    <Check className={cn('ms-auto size-4', theme !== 'light' && 'invisible')}/>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className='size-4' />
                    {resolveLanguageKey("dark")}
                    <Check className={cn('ms-auto size-4', theme !== 'dark' && 'invisible')}/>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                    {resolveLanguageKey("system")}
                    <Check className={cn('ms-auto size-4', theme !== 'system' && 'invisible')}/>
                </DropdownMenuItem>

                {/*
                  * Density lives beside theme because both answer "how should this
                  * app look to me", and neither is worth its own entry point in a
                  * header that is already carrying four controls.
                  */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-2xs font-normal text-muted-foreground">
                    {resolveLanguageKey("density")}
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setDensity('comfortable')}>
                    {resolveLanguageKey("comfortable")}
                    <Check className={cn('ms-auto size-4', density !== 'comfortable' && 'invisible')}/>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDensity('compact')}>
                    {resolveLanguageKey("compact")}
                    <Check className={cn('ms-auto size-4', density !== 'compact' && 'invisible')}/>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default compose(
    withLanguage("src/modules/core/components/custom/themeSwitch.tsx")
)(ThemeSwitch)
