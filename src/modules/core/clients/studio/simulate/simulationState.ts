/**
 * What the access simulator is currently revoking.
 *
 * Separate from the component so importing the contract does not pull in a React tree —
 * `viewEditor` owns this state and the panel only edits it.
 */
export type SimulationState = {
    enabled: boolean;
    /** Paths explicitly revoked. Everything else stays allowed. */
    revokedRead: ReadonlySet<string>;
    revokedWrite: ReadonlySet<string>;
};

export const EMPTY_SIMULATION: SimulationState = {
    enabled: false,
    revokedRead: new Set<string>(),
    revokedWrite: new Set<string>(),
};
