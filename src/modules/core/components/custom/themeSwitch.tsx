import {compose} from "redux";
import { useEffect } from 'react'
import { cn } from "@coreModule/components/lib/utils.ts"
import { Check, Moon, Sun } from 'lucide-react'
import { Button } from '@coreModule/components/ui/button.tsx'
import { useTheme } from '@coreModule/helpers/context/providers/theme-provider.tsx'
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@coreModule/components/ui/dropdown-menu.tsx'

type ThemeSwitchProps = WithLanguageType & {
    showTitles?: boolean,
}

function ThemeSwitch({resolveLanguageKey, showTitles}: ThemeSwitchProps) {
    const { theme, setTheme } = useTheme()

    useEffect(() => {
        const themeColor = theme === 'dark' ? '#020817' : '#fff'
        const metaThemeColor = document.querySelector("meta[name='theme-color']")
        if (metaThemeColor) metaThemeColor.setAttribute('content', themeColor)
    }, [theme])

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size={showTitles ? "default" : "icon"}
                    className="hover:cursor-pointer space-x-0 gap-1"
                    aria-label={resolveLanguageKey("toggleTheme")}
                >
                    <span className="relative flex items-center justify-center size-[1.2rem]">
                        <Sun className="size-[1.2rem] absolute inset-0 scale-100 rotate-0 opacity-100 transition-all duration-300 dark:scale-0 dark:-rotate-90 dark:opacity-0" />
                        <Moon className="size-[1.2rem] absolute inset-0 scale-0 rotate-90 opacity-0 transition-all duration-300 dark:scale-100 dark:rotate-0 dark:opacity-100" />
                    </span>
                    {showTitles && <p>{resolveLanguageKey(theme)}</p>}
                    {/*<span className="sr-only">{resolveLanguageKey("toggleTheme")}</span>*/}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className='size-4' />
                    {resolveLanguageKey("light")}{' '}
                    <Check className={cn('ms-auto1', theme !== 'light' && 'hidden')}/>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className='size-4' />
                    {resolveLanguageKey("dark")}
                    <Check className={cn('ms-auto1', theme !== 'dark' && 'hidden')}/>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                    {resolveLanguageKey("system")}
                    <Check className={cn('ms-auto1', theme !== 'system' && 'hidden')}/>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default compose(
    withLanguage("src/modules/core/components/custom/themeSwitch.tsx")
)(ThemeSwitch)