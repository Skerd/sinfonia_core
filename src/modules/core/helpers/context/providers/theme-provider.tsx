import { getCookie, setCookie, removeCookie } from '@coreModule/helpers/context/cookies/cookies.ts'
import {createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode} from 'react'

/**
 * Public theme preference selected by the user.
 * - `system` means "follow OS preference"
 */
type Theme = 'dark' | 'light' | 'system'
type ResolvedTheme = Exclude<Theme, 'system'>

const DEFAULT_THEME = 'system'
const THEME_COOKIE_NAME = 'client-ui-theme'
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
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
 * Runtime guard used when reading persisted values from cookies.
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
 * - the persisted cookie value
 * - the document root CSS class (`light` / `dark`)
 * - system color-scheme changes while `theme === "system"`
 */
export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = THEME_COOKIE_NAME,
}: ThemeProviderProps) {
  const initialTheme = useMemo<Theme>(() => {
    const persistedTheme = getCookie(storageKey)
    return isTheme(persistedTheme) ? persistedTheme : defaultTheme
  }, [defaultTheme, storageKey])

  const [theme, _setTheme] = useState<Theme>(
    initialTheme
  )

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
    setCookie(storageKey, nextTheme, THEME_COOKIE_MAX_AGE)
    _setTheme(nextTheme)
  }, [storageKey])

  const resetTheme = useCallback(() => {
    removeCookie(storageKey)
    _setTheme(defaultTheme)
  }, [defaultTheme, storageKey])

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

// eslint-disable-next-line react-refresh/only-export-components
/**
 * Accesses the active theme context.
 * Throws when used outside `ThemeProvider`.
 */
export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
