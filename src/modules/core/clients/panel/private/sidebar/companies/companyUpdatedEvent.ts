import {useEffect, useRef} from "react";

/**
 * Tells the sidebar company switcher that a company was saved, so it shows the new name and logo without a page
 * load (FE-05: no refetch counters in Redux). The API emits no company event, so the edit page sends this one;
 * a change made in another tab still shows on the next load.
 * Kept apart from the switcher so the edit page does not import the sidebar.
 */
const COMPANY_UPDATED_EVENT = "panel:company-updated";

export function notifyCompanyUpdated(): void {
    window.dispatchEvent(new CustomEvent(COMPANY_UPDATED_EVENT));
}

/** Runs `onUpdated` (always the latest one) after every {@link notifyCompanyUpdated}. */
export function useOnCompanyUpdated(onUpdated: () => void): void {
    const callbackRef = useRef(onUpdated);
    callbackRef.current = onUpdated;

    useEffect(() => {
        const handler = () => callbackRef.current();
        window.addEventListener(COMPANY_UPDATED_EVENT, handler);
        return () => window.removeEventListener(COMPANY_UPDATED_EVENT, handler);
    }, []);
}
