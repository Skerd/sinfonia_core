import { Monitor, Moon, Rows2, Rows3, Sun, type LucideIcon } from 'lucide-react'
import { Button } from '@coreModule/components/ui/button.tsx'
import {
    DENSITIES,
    Density,
    isDensity,
    useDensity,
} from '@coreModule/helpers/context/providers/density-provider.tsx'
import {
    isTheme,
    Theme,
    THEMES,
    useTheme,
} from '@coreModule/helpers/context/providers/theme-provider.tsx'
import withLanguage, {ResolveLanguageKey, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@coreModule/components/ui/dropdown-menu.tsx'

type ThemeSwitchProps = WithLanguageType & {
    showTitles?: boolean,
}

const THEME_ICONS: Record<Theme, LucideIcon> = {
    light: Sun,
    dark: Moon,
    system: Monitor,
}

const DENSITY_ICONS: Record<Density, LucideIcon> = {
    comfortable: Rows2,
    compact: Rows3,
}

type PreferenceGroupProps<TValue extends string> = {
    /** Language key for the group heading. */
    labelKey: string
    options: readonly TValue[]
    icons: Record<TValue, LucideIcon>
    value: TValue
    /** The provider's own runtime guard, so a stray radio value can never reach the setter. */
    isValue: (candidate: unknown) => candidate is TValue
    onChange: (next: TValue) => void
    resolveLanguageKey: ResolveLanguageKey
}

/**
 * One labeled set of mutually exclusive preferences. Radix radio items carry
 * `role="menuitemradio"` and the checked state themselves, so the selection is
 * announced rather than only drawn, and the options stay driven by the
 * providers' exported constants instead of a hand-kept copy of them.
 */
function PreferenceGroup<TValue extends string>({
    labelKey,
    options,
    icons,
    value,
    isValue,
    onChange,
    resolveLanguageKey,
}: PreferenceGroupProps<TValue>) {
    return (
        <>
            <DropdownMenuLabel className="text-2xs font-normal text-muted-foreground">
                {resolveLanguageKey(labelKey)}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
                value={value}
                onValueChange={(next) => {
                    if (isValue(next)) onChange(next)
                }}
            >
                {options.map((option) => {
                    const Icon: LucideIcon = icons[option]
                    return (
                        <DropdownMenuRadioItem
                            key={option}
                            value={option}
                            className="hover:cursor-pointer whitespace-nowrap"
                        >
                            <Icon className="size-4" />
                            {resolveLanguageKey(option)}
                        </DropdownMenuRadioItem>
                    )
                })}
            </DropdownMenuRadioGroup>
        </>
    )
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
                    {/*
                      * The glyph crossfades on the `dark` class rather than on the
                      * stored preference, so it shows what is actually on screen
                      * even while the choice is `system`.
                      */}
                    <span className="relative flex items-center justify-center size-[1.2rem]">
                        <Sun className="size-[1.2rem] absolute inset-0 scale-100 rotate-0 opacity-100 transition-[transform,opacity] duration-300 dark:scale-0 dark:-rotate-90 dark:opacity-0" />
                        <Moon className="size-[1.2rem] absolute inset-0 scale-0 rotate-90 opacity-0 transition-[transform,opacity] duration-300 dark:scale-100 dark:rotate-0 dark:opacity-100" />
                    </span>
                    {showTitles && <p>{resolveLanguageKey(theme)}</p>}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={showTitles ? "center" : "end"} className="w-max min-w-40">
                <PreferenceGroup
                    labelKey="appearance"
                    options={THEMES}
                    icons={THEME_ICONS}
                    value={theme}
                    isValue={isTheme}
                    onChange={setTheme}
                    resolveLanguageKey={resolveLanguageKey}
                />

                {/*
                  * Density lives beside theme because both answer "how should this
                  * app look to me", and neither is worth its own entry point in a
                  * header that is already carrying four controls.
                  */}
                <DropdownMenuSeparator />
                <PreferenceGroup
                    labelKey="density"
                    options={DENSITIES}
                    icons={DENSITY_ICONS}
                    value={density}
                    isValue={isDensity}
                    onChange={setDensity}
                    resolveLanguageKey={resolveLanguageKey}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default withLanguage("src/modules/core/components/custom/preferences/themeSwitch.tsx")(ThemeSwitch)
