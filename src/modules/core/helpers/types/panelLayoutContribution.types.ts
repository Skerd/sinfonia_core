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
     * The first contribution (by order) returning a string wins; a throwing hook is logged and skipped.
     */
    getCenterPanelClassName?: (args: PanelLayoutContributionArgs) => string | undefined;
};
