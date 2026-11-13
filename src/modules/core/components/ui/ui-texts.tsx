import * as React from "react"
import { ReactReduxContext } from "react-redux"
import useSelectedLanguage from "@coreModule/helpers/hooks/useSelectedLanguage.ts"

type UiTextsProps<K extends string> = {
  /** The primitive's own source path: its dictionary lives at the same path under the core locale folders. */
  path: string
  /** The English texts, used until the dictionary loads and wherever a key is missing. */
  english: Readonly<Record<K, string>>
  children: (text: (key: K) => string) => React.ReactNode
}

/** Whether the app store holds the language: a store-less page or a test's minimal store has none. */
function hasLanguageState(state: unknown): boolean {
  return state != null && typeof state === "object" && "language" in state
}

function TranslatedTexts<K extends string>({ path, english, children }: UiTextsProps<K>) {
  const { currentLanguage } = useSelectedLanguage(path)
  const text = (key: K): string => {
    const value = currentLanguage?.[key]
    return typeof value === "string" && value !== "" ? value : english[key]
  }
  return <>{children(text)}</>
}

/**
 * A UI primitive's own texts (screen-reader labels, default captions) in the app language (TD-F85, TD-F92). A primitive
 * can render where no app store with a language exists (a standalone page, a component test), so it gets the English
 * texts there instead of failing.
 */
function UiTexts<K extends string>({ path, english, children }: UiTextsProps<K>) {
  const redux = React.useContext(ReactReduxContext)
  return redux && hasLanguageState(redux.store.getState()) ? (
    <TranslatedTexts path={path} english={english}>{children}</TranslatedTexts>
  ) : (
    <>{children((key) => english[key])}</>
  )
}

export { UiTexts }
