/**
 * Optional attach file: `src/modules/<pkg>/clients/panel/siteRoomContribution.ts(x)`.
 * Discovered via {@link loadSiteRoomContributions}.
 */
export type SiteRoomContribution = {
    id?: string;
    order?: number;
    /**
     * Maps tenancy systemSettings resource segment → websocket site-room id
     * (e.g. `{ categories: "categories_configurations" }`).
     */
    systemSettingsRooms?: Record<string, string>;
    /** Optional path overrides: `"menu/subview"` → room id. */
    pathRoomOverrides?: Record<string, string>;
};
