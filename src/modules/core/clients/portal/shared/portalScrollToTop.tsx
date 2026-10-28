import {useEffect, useRef} from "react";
import {useLocation} from "react-router-dom";

/** `/account/…` anywhere in the path: the tabs of one account area. */
const ACCOUNT_PATH = /(^|\/)account(\/|$)/;

/** Starts every new page at the top, except when moving between the tabs of an account area. */
export default function PortalScrollToTop() {
    const {pathname} = useLocation();
    const previousPathname = useRef(pathname);

    useEffect(() => {
        const previous = previousPathname.current;
        previousPathname.current = pathname;
        if (ACCOUNT_PATH.test(previous) && ACCOUNT_PATH.test(pathname)) return;
        window.scrollTo({top: 0, left: 0, behavior: "auto"});
    }, [pathname]);

    return null;
}
