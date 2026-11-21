/*
 * Which dictionary a `withLanguage` component reads: `withLanguage` notes it on the component it returns, and a shell
 * that will show a part later (a catalog kind's filters) reads it to load that part's text ahead. Its own module, so a
 * test that replaces `withLanguage` keeps it.
 */
const paths = new WeakMap<object, string>();

export function noteLanguagePath(component: object, componentFilePath: string): void {
    paths.set(component, componentFilePath);
}

/** The dictionary path of a component whose outermost wrapper is `withLanguage`; `undefined` for any other. */
export function languagePathOf(component: unknown): string | undefined {
    return typeof component === "function" ? paths.get(component) : undefined;
}
