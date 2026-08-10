import {createContext, useCallback, useContext, useMemo, useState, type ReactNode} from "react";

export type PageCrumb = {
    label: string;
    /** Absent for the trailing crumb, which is the current page. */
    path?: string;
};

type PageHeaderState = {
    /** Derived from the URL by the shell. */
    routeCrumbs: PageCrumb[];
    /** Published by the current page for entity context the URL cannot express. */
    contextCrumbs: PageCrumb[];
    setContextCrumbs: (crumbs: PageCrumb[]) => void;
};

const PageHeaderContext = createContext<PageHeaderState | undefined>(undefined);

/**
 * Lets a page contribute the tail of the breadcrumb trail.
 *
 * The route alone cannot produce it: `/realEstate/units?floorId=…` knows it is
 * the units list but not that the floor is "Block B / 3". Those names were
 * previously flattened into the page title, which made them unclickable and
 * left the shell breadcrumb permanently two levels deep.
 */
export function PageHeaderProvider({routeCrumbs, children}: {routeCrumbs: PageCrumb[]; children: ReactNode}) {
    const [contextCrumbs, _setContextCrumbs] = useState<PageCrumb[]>([]);

    // Identity-stable so the publishing effect in Header does not re-run on
    // every shell render and drive a set/clear loop.
    const setContextCrumbs = useCallback((next: PageCrumb[]) => {
        _setContextCrumbs((prev) => {
            const same =
                prev.length === next.length &&
                prev.every((crumb, i) => crumb.label === next[i].label && crumb.path === next[i].path);
            return same ? prev : next;
        });
    }, []);

    const value = useMemo(
        () => ({routeCrumbs, contextCrumbs, setContextCrumbs}),
        [routeCrumbs, contextCrumbs, setContextCrumbs],
    );

    return <PageHeaderContext value={value}>{children}</PageHeaderContext>;
}

/**
 * Non-throwing: page primitives also render in the public and shop apps, which
 * do not mount the panel shell.
 */
export function usePageHeader() {
    return useContext(PageHeaderContext);
}
