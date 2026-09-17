const CHARSET = "MdgvJe1soP4jGFwzy5XQRDmHILN8huAiSn7BxUTrlWECtKZafcb2Vq03kOYp96";

/** Largest byte value that maps onto the charset without favouring its first characters. */
const UNBIASED_LIMIT = 256 - (256 % CHARSET.length);

/**
 * Random alphanumeric string of `length` characters (`""` when `length <= 0`).
 * Uses `crypto.getRandomValues` with rejection sampling, so every character is equally likely.
 * Not meant for secrets; use `generateUUID` for identifiers.
 */
export function generateRandomString(length: number): string {
    let result = "";
    const bytes = new Uint8Array(Math.max(length, 0) * 2);
    while (result.length < length) {
        crypto.getRandomValues(bytes);
        for (const byte of bytes) {
            if (byte < UNBIASED_LIMIT) result += CHARSET[byte % CHARSET.length];
            if (result.length === length) break;
        }
    }
    return result;
}
