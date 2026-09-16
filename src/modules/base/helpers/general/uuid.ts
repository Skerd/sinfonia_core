/*
 * Standalone so low-level modules such as storage and the API client can
 * import it without pulling in core helpers/general (React-side imports / cycles).
 */

/**
 * Generates a UUID-like identifier.
 * Uses `crypto.randomUUID` when available, then `crypto.getRandomValues`, then `Math.random` fallback.
 *
 * @returns A RFC4122 v4-compatible UUID string when possible.
 */
export function generateUUID(): string {
  const cryptoApi = globalThis.crypto;

  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }

  if (cryptoApi?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    // Set UUID v4 and RFC4122 variant bits.
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    return `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-${hex[4]}${hex[5]}-${hex[6]}${hex[7]}-${hex[8]}${hex[9]}-${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`;
  }

  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
