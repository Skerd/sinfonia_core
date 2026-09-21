import {usePersistedPreference} from '@coreModule/helpers/context/localStorage/usePersistedPreference.ts'
import {createContext, useContext, useLayoutEffect, useMemo, useSyncExternalStore, ReactNode} from 'react'

/**
 * Public theme preference selected by the user.
 * - `system` means "follow OS preference"
 */
export type Theme = 'dark' | 'light' | 'system'
export type ResolvedTheme = Exclude<Theme, 'system'>

export const THEMES: readonly Theme[] = ['dark', 'light', 'system']
export const THEME_STORAGE_KEY = 'client-ui-theme'
const DEFAULT_THEME: Theme = 'system'
const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)'

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
}

type ThemeProviderState = {
  defaultTheme: Theme
  /** The theme actually on screen; never `system`. Prefer it for rendering decisions. */
  resolvedTheme: ResolvedTheme
  /** The user's stored choice, which may be `system`. Use it for the switcher UI. */
  theme: Theme
  setTheme: (theme: Theme) => void
  resetTheme: () => void
}

/**
 * Runtime guard used when reading persisted values from localStorage.
 */
export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && THEMES.includes(value as Theme)
}

function getDarkSchemeQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  return window.matchMedia(DARK_SCHEME_QUERY)
}

function subscribeToSystemTheme(onChange: () => void) {
  const mediaQuery = getDarkSchemeQuery()
  mediaQuery?.addEventListener('change', onChange)
  return () => mediaQuery?.removeEventListener('change', onChange)
}

/** Falls back to `light` where there is no media query support. */
function getSystemTheme(): ResolvedTheme {
  return getDarkSchemeQuery()?.matches ? 'dark' : 'light'
}

const getServerSystemTheme = (): ResolvedTheme => 'light'

/**
 * The OS color scheme as React state, so `resolvedTheme` re-renders consumers
 * when it flips rather than only retouching the document class.
 */
function useSystemTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribeToSystemTheme, getSystemTheme, getServerSystemTheme)
}

function applyResolvedTheme(resolvedTheme: ResolvedTheme) {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolvedTheme)

  // The class alone only themes our own CSS. Native chrome -- scrollbars,
  // select popups, date pickers, autofill backgrounds -- follows
  // color-scheme, and stays light-on-dark without this.
  root.style.colorScheme = resolvedTheme

  // Read back after the class lands so browser chrome tracks the resolved
  // --background. Owned here rather than in the theme switcher, whose child
  // effect would run before this one and read the previous theme's value.
  const metaThemeColor = document.querySelector("meta[name='theme-color']")
  if (!metaThemeColor) return
  const background = getComputedStyle(document.body).backgroundColor
  if (background) metaThemeColor.setAttribute('content', background)
}

const ThemeContext = createContext<ThemeProviderState | undefined>(undefined)

/**
 * Provides theme state to descendants and keeps it synchronized with:
 * - the persisted localStorage value, including changes from other tabs
 * - the document root CSS class (`light` / `dark`) and `color-scheme`
 * - system color-scheme changes while `theme === "system"`
 */
export function ThemeProvider({children, defaultTheme = DEFAULT_THEME}: ThemeProviderProps) {
  const [theme, setTheme, resetTheme] = usePersistedPreference(THEME_STORAGE_KEY, isTheme, defaultTheme)
  const systemTheme = useSystemTheme()
  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme

  // Layout effect so a switch lands before paint, not one frame after it.
  useLayoutEffect(() => {
    if (typeof document === 'undefined') return
    applyResolvedTheme(resolvedTheme)
  }, [resolvedTheme])

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
