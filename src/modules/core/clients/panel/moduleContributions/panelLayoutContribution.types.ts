/**
 * Optional attach file: `src/modules/<pkg>/clients/panel/panelLayoutContribution.ts(x)`.
 * Lets modules influence center-panel chrome without hardcoding routes in core.
 */
export type PanelLayoutContributionArgs = {
    menu: string | undefined;
    subview: string | undefined;
    isMobile: boolean;
};

export type PanelLayoutContribution = {
    id?: string;
    order?: number;
    /**
     * Return a center-panel className override when this module owns the route.
     * First non-undefined contribution (by order) wins.
     */
    getCenterPanelClassName?: (args: PanelLayoutContributionArgs) => string | undefined;
};
