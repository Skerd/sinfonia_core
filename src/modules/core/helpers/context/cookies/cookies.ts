/**
 * Browser cookie helpers with SSR-safe guards.
 *
 * Notes:
 * - Cookie values and names are URL-encoded/decoded internally.
 * - These helpers are no-ops outside the browser (`document` unavailable).
 * - `setCookie` keeps backward compatibility with the existing numeric `maxAge` argument.
 */

type CookieSameSite = 'Strict' | 'Lax' | 'None'

type BaseCookieOptions = {
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: CookieSameSite
}

export type SetCookieOptions = BaseCookieOptions & {
  maxAge?: number
  expires?: Date
}

export type RemoveCookieOptions = BaseCookieOptions

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const DEFAULT_PATH = '/'
const DEFAULT_SAME_SITE: CookieSameSite = 'Lax'

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function buildCookieAttributes(options: SetCookieOptions): string[] {
  const attributes: string[] = [`path=${options.path ?? DEFAULT_PATH}`]

  if (typeof options.maxAge === 'number' && Number.isFinite(options.maxAge)) {
    attributes.push(`max-age=${Math.trunc(options.maxAge)}`)
  }

  if (options.expires instanceof Date && !Number.isNaN(options.expires.getTime())) {
    attributes.push(`expires=${options.expires.toUTCString()}`)
  }

  if (options.domain) attributes.push(`domain=${options.domain}`)
  attributes.push(`samesite=${options.sameSite ?? DEFAULT_SAME_SITE}`)
  if (options.secure) attributes.push('secure')

  return attributes
}

function normalizeSetCookieOptions(maxAgeOrOptions?: number | SetCookieOptions): SetCookieOptions {
  if (typeof maxAgeOrOptions === 'number') {
    return {maxAge: maxAgeOrOptions}
  }

  return {
    maxAge: DEFAULT_MAX_AGE,
    ...maxAgeOrOptions,
  }
}

/**
 * Reads a cookie by its decoded name.
 *
 * @param name - Cookie name (unencoded)
 * @returns Decoded cookie value or `undefined` when missing/unavailable.
 */
export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined' || !name) return undefined

  const cookies = document.cookie ? document.cookie.split(';') : []
  for (const cookie of cookies) {
    const [rawName, ...valueParts] = cookie.split('=')
    if (!rawName) continue

    const decodedName = safeDecode(rawName.trim())
    if (decodedName !== name) continue

    return safeDecode(valueParts.join('='))
  }

  return undefined
}

/**
 * Writes a cookie.
 *
 * Backward compatible signatures:
 * - `setCookie(name, value)`
 * - `setCookie(name, value, maxAgeInSeconds)`
 * - `setCookie(name, value, { maxAge, path, domain, sameSite, secure, expires })`
 *
 * @param name - Cookie name (unencoded)
 * @param value - Cookie value (unencoded)
 * @param maxAgeOrOptions - Max age seconds or a full cookie options object.
 */
export function setCookie(
  name: string,
  value: string,
  maxAgeOrOptions?: number | SetCookieOptions
): void {
  if (typeof document === 'undefined' || !name) return

  const options = normalizeSetCookieOptions(maxAgeOrOptions)
  const encodedName = encodeURIComponent(name)
  const encodedValue = encodeURIComponent(value)
  const attributes = buildCookieAttributes(options)

  document.cookie = `${encodedName}=${encodedValue}; ${attributes.join('; ')}`
}

/**
 * Removes a cookie by expiring it immediately.
 *
 * For reliable deletion, pass the same `path`/`domain` used when the cookie was set.
 *
 * @param name - Cookie name (unencoded)
 * @param options - Optional cookie scope attributes (`path`, `domain`, `sameSite`, `secure`).
 */
export function removeCookie(name: string, options: RemoveCookieOptions = {}): void {
  if (typeof document === 'undefined' || !name) return

  const encodedName = encodeURIComponent(name)
  const attributes = buildCookieAttributes({
    ...options,
    expires: new Date(0),
    maxAge: 0,
  })

  document.cookie = `${encodedName}=; ${attributes.join('; ')}`
}
