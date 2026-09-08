import {getLocalStorageValue, removeLocalStorageValue, setLocalStorageValue} from '@coreModule/helpers/context/localStorage/localStorageProvider.ts'
import {createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode} from 'react'

/**
 * Public theme preference selected by the user.
 * - `system` means "follow OS preference"
 */
type Theme = 'dark' | 'light' | 'system'
type ResolvedTheme = Exclude<Theme, 'system'>

const DEFAULT_THEME = 'system'
const THEME_STORAGE_KEY = 'client-ui-theme'

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
}

type ThemeProviderState = {
  defaultTheme: Theme
  resolvedTheme: ResolvedTheme
  theme: Theme
  setTheme: (theme: Theme) => void
  resetTheme: () => void
}

const VALID_THEMES: readonly Theme[] = ['dark', 'light', 'system']

/**
 * Runtime guard used when reading persisted values from localStorage.
 */
function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && VALID_THEMES.includes(value as Theme)
}

/**
 * Resolves the effective theme from the current system color-scheme preference.
 * Falls back to `light` in non-browser environments.
 */
function getSystemResolvedTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const ThemeContext = createContext<ThemeProviderState | undefined>(undefined)

/**
 * Provides theme state to descendants and keeps it synchronized with:
 * - the persisted localStorage value
 * - the document root CSS class (`light` / `dark`)
 * - system color-scheme changes while `theme === "system"`
 */
export function ThemeProvider({children, defaultTheme = DEFAULT_THEME}: ThemeProviderProps) {
  const initialTheme = useMemo<Theme>(() => {
    const persistedTheme = getLocalStorageValue(THEME_STORAGE_KEY)
    return isTheme(persistedTheme) ? persistedTheme : defaultTheme
  }, [defaultTheme])

  const [theme, _setTheme] = useState<Theme>(initialTheme)

  const resolvedTheme = useMemo((): ResolvedTheme => {
    if (theme === 'system') {
      return getSystemResolvedTheme()
    }
    return theme as ResolvedTheme
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const root = window.document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = (currentResolvedTheme: ResolvedTheme) => {
      root.classList.remove('light', 'dark') // Remove existing theme classes
      root.classList.add(currentResolvedTheme) // Add the new theme class

      // The class alone only themes our own CSS. Native chrome -- scrollbars,
      // select popups, date pickers, autofill backgrounds -- follows
      // color-scheme, and stays light-on-dark without this.
      root.style.colorScheme = currentResolvedTheme

      // Read back after the class lands so browser chrome tracks the resolved
      // --background. Owned here rather than in the theme switcher, whose child
      // effect would run before this one and read the previous theme's value.
      const metaThemeColor = document.querySelector("meta[name='theme-color']")
      if (!metaThemeColor) return
      const background = getComputedStyle(document.body).backgroundColor
      if (background) metaThemeColor.setAttribute('content', background)
    }

    const handleChange = () => {
      if (theme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light'
        applyTheme(systemTheme)
      }
    }

    applyTheme(resolvedTheme)

    mediaQuery.addEventListener?.('change', handleChange)

    return () => mediaQuery.removeEventListener?.('change', handleChange)
  }, [theme, resolvedTheme])

  const setTheme = useCallback((nextTheme: Theme) => {
    setLocalStorageValue(THEME_STORAGE_KEY, nextTheme)
    _setTheme(nextTheme)
  }, [])

  const resetTheme = useCallback(() => {
    removeLocalStorageValue(THEME_STORAGE_KEY)
    _setTheme(defaultTheme)
  }, [defaultTheme])

  const contextValue = useMemo(() => ({
    defaultTheme,
    resolvedTheme,
    resetTheme,
    theme,
    setTheme,
  }), [defaultTheme, resolvedTheme, resetTheme, setTheme, theme])

  return (
    <ThemeContext value={contextValue}>
      {children}
    </ThemeContext>
  )
}

/**
 * Accesses the active theme context.
 * Throws when used outside `ThemeProvider`.
 */
export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')

  return context
}

/**
 * Non-throwing variant for shared primitives that may render in the public and
 * shop apps, which do not mount `ThemeProvider`. Prefer `useTheme` in panel code
 * so a missing provider stays a loud failure.
 */
export const useThemeOptional = () => useContext(ThemeContext)
