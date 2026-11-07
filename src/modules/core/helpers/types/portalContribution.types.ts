import type {ComponentType, ReactNode} from "react";

/** One kind of item a section lists in the home catalog (e.g. `product`, `vehicleCategory`). */
export type PortalCatalog = {
    /** Item kind, as `POST /api/portal/browse` reports it. */
    kind: string;
    /** This kind's own filters on the home catalog; they read and write `f.<name>` search params. */
    Filters?: ComponentType;
    /** A block above this kind's filters while its tab is open (the dentists' estimate request); links start at `useSectionBase()`. */
    Intro?: ComponentType;
};

/**
 * A page a module serves at `/<path>` on every portal host (the apex and every company's own site), whatever sections
 * the host lists, inside the portal shell and `SitePageLayout`. Never linked from the navbar or footer: it is the
 * target of a link the module sends itself (e.g. a token link in an email, D96).
 */
export type PortalHostPage = {
    /** Path from the host root, e.g. `tender-portal`; a leading `/` is ignored. Pick one no section path takes. */
    path: string;
    Page: ComponentType;
};

/**
 * One section of the portal (shop, car rental, dentists, properties). The portal renders
 * its pages in its own shell, on the apex and on every company's own site.
 */
export type PortalSection = {
    id?: string;
    /** Lower runs earlier; default 100. */
    order?: number;
    /** Section key, as `POST /api/portal/site` lists it (e.g. `carRental`). */
    section: string;
    /** URL segment of the section (e.g. `car-rental`). */
    path: string;
    /**
     * One company's pages: under `/<path>/<company>/*` on the apex (the company travels in
     * `x-site-company`), under `/<path>/*` on the company's own site. Links start at `useSectionBase()`.
     */
    CompanySite?: ComponentType;
    /** Pages spanning the section (the shop), under `/<path>/*` on every host; the API scopes them by host. */
    SectionSite?: ComponentType;
    /**
     * Pages about several of the section's companies at once (e.g. one estimate request to several
     * clinics), on the apex only, under `/<path>/<page.path>`. A fixed segment, so it wins over
     * `/<path>/<company>`; pick one no company slug would take.
     */
    sectionPages?: readonly {path: string; Page: ComponentType}[];
    /** Item kinds the section lists in the home catalog, in tab order. */
    catalogs?: readonly PortalCatalog[];
    /** A block on the home page above the catalog (the shop's CMS blocks and categories). */
    Home?: ComponentType;
    /** Wraps the whole site, for state the navbar shares with the section's pages (the shop's cart). */
    Provider?: ComponentType<{children: ReactNode}>;
    /** A control in the navbar (the shop's cart). */
    NavAction?: ComponentType;
    /** The signed-in visitor's bookings or orders in this section, on the account page. */
    AccountSection?: ComponentType;
    /** Pages outside the section's URL space, on every host (see {@link PortalHostPage}). */
    hostPages?: readonly PortalHostPage[];
};

/** A module that offers no section, only pages on every host (see {@link PortalHostPage}). */
export type PortalHostPagesContribution = {
    id?: string;
    /** Lower runs earlier; default 100. */
    order?: number;
    section?: undefined;
    hostPages: readonly PortalHostPage[];
};

/**
 * Optional attach file: `src/modules/<pkg>/clients/portal/portalContribution.ts(x)`.
 * Either a section of the portal, or only pages on every host.
 */
export type PortalContribution = PortalSection | PortalHostPagesContribution;
