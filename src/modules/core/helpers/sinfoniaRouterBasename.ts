/** Vite injects BASE_URL from `base` (e.g. `/` or `/public/`). */
export function sinfoniaRouterBasename(): string | undefined {
    const base = import.meta.env.BASE_URL || "/";
    const normalized = base.replace(/\/+$/, "") || "/";
    return normalized === "/" ? undefined : normalized;
}
