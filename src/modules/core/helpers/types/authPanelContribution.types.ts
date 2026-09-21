import type {ComponentType} from "react";

/**
 * Optional attach file: `src/modules/<pkg>/clients/panel/authPanelContribution.ts(x)`.
 * Lets modules register public `/authenticate/:panel` screens without importing into core.
 *
 * Panel keys match the `:panel` route param (e.g. `resetPosManagerPin`). Core keys
 * (`CORE_AUTH_PANEL_KEYS`, e.g. `login`) are reserved and ignored with a dev warning.
 */
export type AuthPanelContribution = {
    id?: string;
    /** Lower runs earlier; default 100. Later contributions overwrite the same panel key. */
    order?: number;
    panels: Record<string, ComponentType>;
};
