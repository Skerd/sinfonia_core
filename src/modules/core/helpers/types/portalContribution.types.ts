import type {ComponentType, ReactNode} from "react";

/** One kind of item a section lists in the home catalog (e.g. `product`, `vehicleCategory`). */
export type PortalCatalog = {
    /** Item kind, as `POST /api/portal/browse` reports it. */
    kind: string;
    /** This kind's own filters on the home catalog; they read and write `f.<name>` search params. */
    Filters?: ComponentType;
};

/**
 * Optional attach file: `src/modules/<pkg>/clients/portal/portalContribution.ts(x)`.
 * One section of the portal (shop, car rental, dentists, properties). The portal renders
 * its pages in its own shell, on the apex and on every company's own site.
 */
export type PortalContribution = {
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
};
