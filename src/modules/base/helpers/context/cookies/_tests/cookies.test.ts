import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {getCookie, removeCookie, setCookie} from "@baseModule/helpers/context/cookies/cookies.ts";

const cookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, "cookie")!;
let writes: string[] = [];

/** Every raw string assigned to `document.cookie`, still forwarded to jsdom's jar. */
function recordCookieWrites() {
    writes = [];
    Object.defineProperty(document, "cookie", {
        configurable: true,
        get: () => cookieDescriptor.get!.call(document),
        set: (value: string) => {
            writes.push(value);
            cookieDescriptor.set!.call(document, value);
        },
    });
}

const lastWrite = () => writes[writes.length - 1];
const attributesOf = (write: string) => write.split("; ").slice(1);

/** Replaces the whole jar view, for parsing tests that need exact header shapes. */
function stubCookieHeader(header: string) {
    Object.defineProperty(document, "cookie", {configurable: true, get: () => header, set: () => {}});
}

beforeEach(() => {
    recordCookieWrites();
});

afterEach(() => {
    // Restore `document` before cleanup — the SSR test stubs it to `undefined`.
    vi.unstubAllGlobals();
    for (const name of ["a", "session", "weird name", "x", "x(1)"]) removeCookie(name);
    delete (document as unknown as Record<string, unknown>).cookie;
    vi.useRealTimers();
});

describe("setCookie / getCookie", () => {
    it("round-trips encoded names and values", () => {
        setCookie("weird name", "a=b; c,d é");

        expect(getCookie("weird name")).toBe("a=b; c,d é");
        expect(lastWrite().startsWith("weird%20name=a%3Db%3B%20c%2Cd%20%C3%A9;")).toBe(true);
    });

    it("applies the defaults: path, 7-day max-age, Lax, not secure on http", () => {
        setCookie("a", "1");

        expect(attributesOf(lastWrite())).toEqual(["path=/", `max-age=${60 * 60 * 24 * 7}`, "samesite=Lax"]);
    });

    it("keeps the numeric max-age signature", () => {
        setCookie("a", "1", 60.9);

        expect(attributesOf(lastWrite())).toContain("max-age=60");
    });

    it("writes a caller-provided expiry without a default max-age that would override it", () => {
        const expires = new Date("2030-01-02T03:04:05Z");

        setCookie("a", "1", {expires});

        const attributes = attributesOf(lastWrite());
        expect(attributes).toContain(`expires=${expires.toUTCString()}`);
        expect(attributes.some((attribute) => attribute.startsWith("max-age"))).toBe(false);
    });

    it("keeps an explicit max-age alongside expires", () => {
        setCookie("a", "1", {expires: new Date("2030-01-01T00:00:00Z"), maxAge: 10});

        expect(attributesOf(lastWrite())).toContain("max-age=10");
    });

    it("ignores an invalid expiry date", () => {
        setCookie("a", "1", {expires: new Date("nope"), maxAge: 5});

        expect(lastWrite()).not.toContain("expires=");
    });

    it("passes through path, domain, sameSite and secure", () => {
        setCookie("a", "1", {path: "/app", domain: "example.com", sameSite: "Strict", secure: true});

        expect(attributesOf(lastWrite())).toEqual(["path=/app", `max-age=${60 * 60 * 24 * 7}`, "domain=example.com", "samesite=Strict", "secure"]);
    });

    it("forces secure for SameSite=None, which browsers reject otherwise", () => {
        setCookie("a", "1", {sameSite: "None", secure: false});

        expect(attributesOf(lastWrite())).toContain("secure");
    });

    it("defaults to secure on https pages unless told otherwise", () => {
        vi.stubGlobal("location", {protocol: "https:"});

        setCookie("a", "1");
        expect(attributesOf(lastWrite())).toContain("secure");

        setCookie("a", "1", {secure: false});
        expect(attributesOf(lastWrite())).not.toContain("secure");
    });

    it("encodes parentheses in names", () => {
        setCookie("x(1)", "v");

        expect(lastWrite().startsWith("x%281%29=v;")).toBe(true);
    });

    it.each([
        ["path", {path: "/; domain=evil.com"}],
        ["domain", {domain: "example.com\r\nSet-Cookie: x=1"}],
    ])("rejects a %s that could inject attributes", (_attribute, options) => {
        expect(() => setCookie("a", "1", options)).toThrow(TypeError);
        expect(writes).toHaveLength(0);
    });

    it("ignores an empty name", () => {
        setCookie("", "1");

        expect(writes).toHaveLength(0);
        expect(getCookie("")).toBeUndefined();
    });
});

describe("getCookie parsing", () => {
    it("returns undefined for a missing cookie or an empty jar", () => {
        stubCookieHeader("");
        expect(getCookie("a")).toBeUndefined();

        stubCookieHeader("b=2");
        expect(getCookie("a")).toBeUndefined();
    });

    it("finds a cookie among several and tolerates spacing", () => {
        stubCookieHeader("b=2;  a = 1 ; c=3");

        expect(getCookie("a")).toBe("1");
        expect(getCookie("c")).toBe("3");
    });

    it("keeps '=' inside values, strips surrounding quotes, and returns empty values", () => {
        stubCookieHeader(`token=abc==; quoted="hello"; empty=`);

        expect(getCookie("token")).toBe("abc==");
        expect(getCookie("quoted")).toBe("hello");
        expect(getCookie("empty")).toBe("");
    });

    it("skips entries without '=' and falls back to the raw text for malformed encoding", () => {
        stubCookieHeader("flag; bad=%E0%A4%A");

        expect(getCookie("flag")).toBeUndefined();
        expect(getCookie("bad")).toBe("%E0%A4%A");
    });

    it("returns the first match when a name appears twice (most specific path first)", () => {
        stubCookieHeader("a=deep; a=root");

        expect(getCookie("a")).toBe("deep");
    });
});

describe("removeCookie", () => {
    it("expires the cookie in the same scope", () => {
        setCookie("session", "1", {path: "/"});
        expect(getCookie("session")).toBe("1");

        removeCookie("session", {path: "/"});

        expect(getCookie("session")).toBeUndefined();
        const attributes = attributesOf(lastWrite());
        expect(lastWrite().startsWith("session=;")).toBe(true);
        expect(attributes).toContain("max-age=0");
        expect(attributes).toContain(`expires=${new Date(0).toUTCString()}`);
    });

    it("uses the given domain so the right cookie is targeted", () => {
        removeCookie("session", {domain: "example.com", path: "/app"});

        expect(attributesOf(lastWrite())).toEqual(expect.arrayContaining(["path=/app", "domain=example.com"]));
    });
});

describe("without a document", () => {
    it("is a no-op", () => {
        vi.stubGlobal("document", undefined);

        expect(getCookie("a")).toBeUndefined();
        expect(() => setCookie("a", "1")).not.toThrow();
        expect(() => removeCookie("a")).not.toThrow();
    });
});
