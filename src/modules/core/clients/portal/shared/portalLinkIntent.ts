import {useEffect, useRef} from "react";
import {prefetchHttpRequest} from "@coreModule/helpers/apiClient/responseCache.ts";
import type {PortalSection} from "@coreModule/helpers/types/portalContribution.types.ts";
import type {PortalSite} from "armonia/src/modules/core/api/portal/public/portal/portal.dto.ts";
import {portalCitySlug} from "armonia/src/modules/core/helpers/slug.ts";
import {BROWSE_REQUEST, browseForm, landingSearch} from "../home/catalogBrowse.ts";
import {COMPANIES_REQUEST, companyLookupBody} from "./portalCompanies.ts";
import {rememberImageOrigin} from "./portalImageMotion.ts";
import {endPortalNavigation, startPortalNavigation} from "./portalProgress.tsx";

/** A mouse resting this long on a link means the visitor is about to follow it. */
const HOVER_INTENT_MS = 65;
/** The same link is not asked ahead again this soon (the cache would answer anyway). */
const REPEAT_MS = 5000;

/** The visitor's own core pages (behind sign-in), by path: their code is loaded ahead of a click. */
const ACCOUNT_PAGES: Record<string, () => Promise<unknown>> = {
    "/account": () => import("../account/index.tsx"),
    "/account/profile": () => import("../account/profile.tsx"),
    "/account/security": () => import("../account/security.tsx"),
};

/** The link an event happened on, when following it keeps the visitor in this tab and this app. */
function internalLink(target: EventTarget | null): {anchor: HTMLAnchorElement; url: URL} | null {
    if (!(target instanceof Element)) return null;
    const anchor = target.closest<HTMLAnchorElement>("a[href]");
    if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return null;
    const url = new URL(anchor.href, window.location.href);
    return url.origin === window.location.origin ? {anchor, url} : null;
}

/**
 * Asks ahead for what the page behind `url` opens with: the home catalog's results, the code of the visitor's own
 * pages, an apex company site's company, and whatever the section's own `prefetch` loads (the page's code and reads).
 */
export function prefetchPortalLink(url: URL, site: Pick<PortalSite, "scope" | "landings"> | null | undefined, sections: readonly PortalSection[]): void {
    const accountPage = ACCOUNT_PAGES[url.pathname.replace(/\/$/, "")];
    if (accountPage) {
        void import("../account/layout.tsx");
        void accountPage();
        return;
    }
    const [first, ...rest] = url.pathname.split("/").filter(Boolean);
    if (first === undefined) {
        void import("../home/index.tsx");
        prefetchHttpRequest(BROWSE_REQUEST, browseForm(url.searchParams));
        return;
    }
    const section = sections.find((candidate) => candidate.path === first);
    if (!section) return;
    // A city landing page (D181), on the apex: its code and its catalog's results, never a company called "in".
    if (site?.scope !== "company" && rest[0] === "in" && rest.length === 2) {
        void import("../landing/index.tsx");
        const landing = site?.landings.find((candidate) => candidate.section === section.section && portalCitySlug(candidate.city) === rest[1]);
        if (landing) prefetchHttpRequest(BROWSE_REQUEST, browseForm(landingSearch(url.searchParams, section, landing.city)));
        return;
    }
    // On the apex a company's pages sit under `/<path>/<company>`, unless the segment is one of the section's own pages.
    const companySite = !section.SectionSite && !!section.CompanySite && site?.scope !== "company"
        && !(section.sectionPages ?? []).some((page) => page.path === rest[0]);
    if (!companySite) {
        section.prefetch?.({path: `/${rest.join("/")}`, params: url.searchParams});
        return;
    }
    const [siteCompany, ...inner] = rest;
    if (!siteCompany) return;
    prefetchHttpRequest(COMPANIES_REQUEST, companyLookupBody(section.section, siteCompany), {siteCompany});
    section.prefetch?.({path: `/${inner.join("/")}`, params: url.searchParams, siteCompany});
}

/**
 * Watches the visitor's links across the whole page: a link pointed at (after a short rest), touched or focused is
 * asked ahead; a followed link remembers its picture (for the next page's hero) and starts the progress bar, and so
 * does Back.
 */
export function usePortalLinkIntent(site: PortalSite | null | undefined, sections: readonly PortalSection[]): void {
    const latest = useRef({site, sections});
    useEffect(() => {
        latest.current = {site, sections};
    }, [site, sections]);

    useEffect(() => {
        let hovered: HTMLAnchorElement | null = null;
        let hoverTimer: ReturnType<typeof setTimeout> | undefined;
        let last = {href: "", at: 0};

        const prefetch = (url: URL) => {
            const href = url.pathname + url.search;
            const now = Date.now();
            if (href === last.href && now - last.at < REPEAT_MS) return;
            last = {href, at: now};
            prefetchPortalLink(url, latest.current.site, latest.current.sections);
        };
        const onPointerOver = (event: PointerEvent) => {
            if (event.pointerType === "touch") return;
            const link = internalLink(event.target);
            if (link?.anchor === hovered) return;
            clearTimeout(hoverTimer);
            hovered = link?.anchor ?? null;
            if (link) hoverTimer = setTimeout(() => prefetch(link.url), HOVER_INTENT_MS);
        };
        const onPointerOut = (event: PointerEvent) => {
            if (!hovered || (event.relatedTarget instanceof Node && hovered.contains(event.relatedTarget))) return;
            clearTimeout(hoverTimer);
            hovered = null;
        };
        // A finger or pen has no hover: touching the link is the intent.
        const onPointerDown = (event: PointerEvent) => {
            if (event.pointerType === "mouse") return;
            const link = internalLink(event.target);
            if (link) prefetch(link.url);
        };
        const onFocusIn = (event: FocusEvent) => {
            const link = internalLink(event.target);
            if (link) prefetch(link.url);
        };
        const onClick = (event: MouseEvent) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const link = internalLink(event.target);
            if (!link) return;
            const before = window.location.href;
            rememberImageOrigin(link.anchor);
            startPortalNavigation();
            // The router follows a link while the click is handled; one it did not follow (an anchor on the same
            // page, a link whose own handler stopped it) leaves the address as it was.
            setTimeout(() => {
                if (window.location.href === before) endPortalNavigation();
            }, 0);
        };
        const onPopState = () => startPortalNavigation();

        document.addEventListener("pointerover", onPointerOver);
        document.addEventListener("pointerout", onPointerOut);
        document.addEventListener("pointerdown", onPointerDown, {passive: true});
        document.addEventListener("focusin", onFocusIn);
        document.addEventListener("click", onClick, true);
        window.addEventListener("popstate", onPopState);
        return () => {
            clearTimeout(hoverTimer);
            document.removeEventListener("pointerover", onPointerOver);
            document.removeEventListener("pointerout", onPointerOut);
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("focusin", onFocusIn);
            document.removeEventListener("click", onClick, true);
            window.removeEventListener("popstate", onPopState);
        };
    }, []);
}
