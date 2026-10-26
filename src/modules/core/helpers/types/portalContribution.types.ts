import type {ComponentType} from "react";

/**
 * Optional attach file: `src/modules/<pkg>/clients/portal/portalContribution.ts(x)`.
 * One section of the central portal (shop, car rental, dentists, properties), served by
 * the module's existing public pages.
 */
export type PortalContribution = {
    id?: string;
    /** Lower runs earlier; default 100. */
    order?: number;
    /** Section key, as `POST /api/portal/sections` reports it (e.g. `carRental`). */
    section: string;
    /** URL segment of the section on the portal (e.g. `car-rental`). */
    path: string;
    /**
     * One company's site, rendered under `/<path>/<company>/*` with its own router (its
     * absolute links resolve there) and the company in `x-site-company`.
     */
    CompanySite?: ComponentType;
    /** A site spanning every company (the shop), rendered under `/<path>/*` with its own router. */
    SectionSite?: ComponentType;
    /** Extra search shown on the section's page above its companies (e.g. rental dates). */
    SectionSearch?: ComponentType<{city: string}>;
    /** The signed-in visitor's bookings or orders in this section, on the portal account page. */
    AccountSection?: ComponentType;
};
