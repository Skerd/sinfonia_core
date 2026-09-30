/**
 * Backend auth failures that mean the panel session is gone.
 * Maestro returns HTTP 403 (not 401) for `token_verification_failed` / `no_token`.
 * `session_not_found` defaults to HTTP 400.
 */
export const SESSION_EXPIRED_ERROR_CODES = new Set([
    "token_verification_failed",
    "no_token",
    "session_not_found",
]);
