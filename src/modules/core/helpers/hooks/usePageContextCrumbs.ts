import {useContext, useEffect, useId} from "react";
import {PageHeaderContext, type PageCrumb} from "@coreModule/helpers/context/pageHeaderContext.tsx";

/**
 * Publishes `crumbs` as the page's context crumbs while mounted. Compared by value,
 * so passing a fresh array each render is fine. No-op outside `PageHeaderProvider`.
 */
export function usePageContextCrumbs(crumbs: readonly PageCrumb[]): void {
    const publish = useContext(PageHeaderContext)?.publishContextCrumbs;
    const id = useId();
    const key = JSON.stringify(crumbs.map(({label, path}) => (path === undefined ? [label] : [label, path])));

    useEffect(() => {
        if (!publish) return;
        const parsed = (JSON.parse(key) as [string, string?][]).map(([label, path]) =>
            path === undefined ? {label} : {label, path},
        );
        return publish(id, parsed);
    }, [publish, id, key]);
}
