/**
 * `/authenticate/:panel` keys rendered by core itself. Modules cannot register these; kept apart
 * from the page so the contribution loader does not import the core auth forms.
 */
export const CORE_AUTH_PANEL_KEYS = [
    "login",
    "requestResetPassword",
    "resetPassword",
    "deactivateOTP",
    "signUp",
    "activateAccount",
    "acceptInvitation",
] as const;

export type CoreAuthPanelKey = (typeof CORE_AUTH_PANEL_KEYS)[number];
