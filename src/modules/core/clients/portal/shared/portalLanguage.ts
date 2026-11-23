import {useEffect, useRef} from "react";
import {useDispatch} from "react-redux";
import {useLocation} from "react-router-dom";
import {SUPPORTED_LOCALES} from "armonia/src/modules/core/constants/index.ts";
import {pickLanguage} from "@coreModule/helpers/redux/slices/languageSlice.ts";

/**
 * Speaks the language the address names (`?lang=sq-AL`, D181): the version of a page search engines list in each
 * language, whose head the server already wrote in it. Applied once per language named, so a language the visitor
 * picks afterwards stays, and the portal's own links need not carry it.
 */
export function usePortalAddressLanguage(): void {
    const dispatch = useDispatch();
    const {search} = useLocation();
    const asked = new URLSearchParams(search).get("lang");
    const applied = useRef<string | null>(null);
    useEffect(() => {
        const locale = SUPPORTED_LOCALES.find((code) => code === asked);
        if (!locale || applied.current === locale) return;
        applied.current = locale;
        dispatch(pickLanguage(locale));
    }, [asked, dispatch]);
}
