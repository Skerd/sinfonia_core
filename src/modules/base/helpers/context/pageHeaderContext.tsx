import {createContext, useCallback, useContext, useMemo, useState, type ReactNode} from "react";

export type PageCrumb = {
    label: string;
    /** Absent for the trailing crumb, which is the current page. */
    path?: string;
};

export type PageHeaderState = {
    /** Derived from the URL by the shell. */
    routeCrumbs: readonly PageCrumb[];
    /** Published by the current page for entity context the URL cannot express. */
    contextCrumbs: readonly PageCrumb[];
    /** `routeCrumbs` followed by `contextCrumbs`: the full breadcrumb trail. */
    trail: readonly PageCrumb[];
    /**
     * Registers `crumbs` for publisher `id` and returns its release. Prefer
     * {@link usePageContextCrumbs}, which handles ids and cleanup.
     */
    publishContextCrumbs: (id: string, crumbs: readonly PageCrumb[]) => () => void;
};

type Publication = {id: string; crumbs: readonly PageCrumb[]};

const EMPTY: readonly PageCrumb[] = [];

export const PageHeaderContext = createContext<PageHeaderState | undefined>(undefined);

function sameCrumbs(a: readonly PageCrumb[], b: readonly PageCrumb[]): boolean {
    return a.length === b.length && a.every((crumb, i) => crumb.label === b[i].label && crumb.path === b[i].path);
}

/**
 * Lets a page contribute the tail of the breadcrumb trail.
 *
 * The route alone cannot produce it: `/realEstate/units?floorId=…` knows it is
 * the units list but not that the floor is "Block B / 3". Those names were
 * previously flattened into the page title, which made them unclickable and
 * left the shell breadcrumb permanently two levels deep.
 *
 * Several headers can be mounted at once (a hub page around an embedded list).
 * Each publishes under its own id; the most recent publication with crumbs is
 * shown, and a header unmounting only withdraws its own crumbs.
 */
export function PageHeaderProvider({routeCrumbs, children}: {routeCrumbs: readonly PageCrumb[]; children: ReactNode}) {
    const [publications, setPublications] = useState<readonly Publication[]>([]);

    // Identity-stable so publishing effects do not re-run on every shell render.
    const publishContextCrumbs = useCallback((id: string, crumbs: readonly PageCrumb[]) => {
        setPublications((prev) => {
            const last = prev.at(-1);
            if (last?.id === id && sameCrumbs(last.crumbs, crumbs)) return prev;
            return [...prev.filter((publication) => publication.id !== id), {id, crumbs}];
        });
        return () => {
            setPublications((prev) =>
                prev.some((publication) => publication.id === id)
                    ? prev.filter((publication) => publication.id !== id)
                    : prev,
            );
        };
    }, []);

    const contextCrumbs = useMemo(
        () => publications.findLast((publication) => publication.crumbs.length > 0)?.crumbs ?? EMPTY,
        [publications],
    );

    const trail = useMemo(() => [...routeCrumbs, ...contextCrumbs], [routeCrumbs, contextCrumbs]);

    const value = useMemo<PageHeaderState>(
        () => ({routeCrumbs, contextCrumbs, trail, publishContextCrumbs}),
        [routeCrumbs, contextCrumbs, trail, publishContextCrumbs],
    );

    return <PageHeaderContext value={value}>{children}</PageHeaderContext>;
}

/**
 * Non-throwing: page primitives also render in the public and shop apps, which
 * do not mount the panel shell.
 */
export function usePageHeader(): PageHeaderState | undefined {
    return useContext(PageHeaderContext);
}
