import {isValidElement, useCallback, useContext, useRef, type MouseEvent, type ReactNode} from "react";
import {useSelector} from "react-redux";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import TruncatedValue from "./truncatedValue.tsx";
import CountryFlag from "@coreModule/components/viewEngine/widgets/display/countryFlag.tsx";
import {MdiIcon} from "@coreModule/components/custom/mdiIcons/mdiIcon.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";
import {IconPhoto} from "@tabler/icons-react";
import {accessFieldPathExists} from "@coreModule/helpers/context/accessContext.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import SheetMediaFilesStrip from "@coreModule/components/viewEngine/sheet/widgets/sheetMediaFilesStrip.tsx";
import type {Media} from "armonia/src/modules/core/types";
import {useAccessFieldsRead} from "./accessFields.tsx";
import {formatDate} from "@coreModule/helpers/general/dateTime.ts";
import {formatNumber} from "@coreModule/helpers/general/numbers.ts";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import useSelectedLanguage from "@coreModule/helpers/hooks/useSelectedLanguage.ts";
import {
    LanguageResolveContext,
    type ResolveLanguageKey, type ResolveLanguageKeyImpl,
    type TranslationValue,
} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {MEDIA_BASE_URL} from "@coreModule/helpers/constants/media.constants.ts";

export type DisplayValueType =
    | "string"
    | "number"
    | "locale"
    | "date"
    | "dateTime"
    | "boolean"
    | "longText"
    | "area"
    | "phoneCode"
    | "phoneNumber"
    | "email"
    | "icon"
    | "avatar"
    | "flag"
    | "user"
    | "currency"
    | "enum"
    | "media";

type DisplayValueProps = {
    value: unknown;
    /** ACL dotted path (`area`, `unitType.name`). Walks nested `keys` via `accessFieldPathExists`. */
    path?: string;
    type?: DisplayValueType;
    /**
     * Prefix for `type="enum"` (`constructionTypes` + `hvac` → `constructionTypes.hvac`).
     * Resolved against the nearest card/sheet language file via {@link LanguageResolveContext}.
     */
    languageKeyCategory?: string;
    /** Wraps the formatted value (`Badge`, `div`, anything). */
    children?: (formatted: ReactNode) => ReactNode;
    /** Intl overrides for `date` / `dateTime`. Defaults: `15 Aug 2026` or `15 Aug 2026, 21:06`. */
    format?: Intl.DateTimeFormatOptions;
    /**
     * Pixel size for `icon` (square), `avatar` (square), and `flag` (width; height stays 24×18).
     * Icon default 18 matches the country-flag height. Avatar default 48 matches header logos.
     */
    size?: number;
    /** Wins over `path`. */
    show?: boolean;
    /** If set, uses this resource instead of the nearest `AccessFields` read map. */
    resource?: string;
    className?: string;
};

/*
 * Migration-temporary, like the `SHARED_DICTIONARIES` entries in
 * `base/helpers/hocs/_tests/withLanguagePaths.test.ts`: this component now lives under `base/`,
 * but `base` has no `assets/languages` tree, so the dictionary stays at its core path until the
 * package migrates back into core. Unlike the `withLanguage()` call sites, this one is resolved
 * directly and is NOT covered by that guard test — a missing dictionary fails silently (every key
 * renders as `---key---`), so keep this string in step with the JSON under
 * `core/assets/languages/<locale>/components/custom/displayValue/displayValue.json`.
 */
const DISPLAY_VALUE_LANG_PATH =
    "src/modules/core/components/custom/displayValue/displayValue.tsx";

const HIDDEN_RANDOM_LENGTH = 8;
const LONG_TEXT_THRESHOLD = 800;
const DATE_ONLY_ISO = /^\d{4}-\d{2}-\d{2}$/;
const FLAG_WIDTH = 24;
const FLAG_HEIGHT = 18;
const ICON_SIZE = 18;
const AVATAR_SIZE = 48;

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
};

const DATE_TIME_FORMAT: Intl.DateTimeFormatOptions = {
    ...DATE_FORMAT,
    hour: "2-digit",
    minute: "2-digit",
};

function isEmptyValue(value: unknown): boolean {
    return value === null || value === undefined || value === "";
}

function toMediaList(value: unknown): Media[] {
    const out: Media[] = [];
    const push = (item: unknown) => {
        if (item == null) return;
        if (typeof item === "string" && item.length > 0) {
            out.push({_id: item} as Media);
            return;
        }
        if (typeof item === "object" && typeof (item as {_id?: unknown})._id === "string") {
            out.push(item as Media);
        }
    };
    if (Array.isArray(value)) {
        for (const item of value) push(item);
    } else {
        push(value);
    }
    return out;
}

function formatGroupedNumber(value: number, fractionDigits?: number): string {
    if (!Number.isFinite(value)) return "";
    return formatNumber(value, {
        useGrouping: true,
        ...(fractionDigits != null
            ? {minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits}
            : {}),
    });
}

function toDate(value: unknown): Date | null {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }
    if (typeof value === "string" || typeof value === "number") {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
}

function isDateOnlyIso(value: string): boolean {
    if (!DATE_ONLY_ISO.test(value)) return false;
    return !Number.isNaN(new Date(value).getTime());
}

/**
 * Calendar dates (`date`) always format in UTC so a stored UTC-midnight day does not shift.
 * Instants (`dateTime`) use the signed-in user's timezone.
 */
function formatTemporal(
    value: unknown,
    mode: "date" | "dateTime",
    timeZone: string,
    format?: Intl.DateTimeFormatOptions,
): string {
    const d = toDate(value);
    if (!d) return String(value);
    const formatted = formatDate(d, {
        timeZone: mode === "date" ? "UTC" : timeZone,
        format: format ?? (mode === "dateTime" ? DATE_TIME_FORMAT : DATE_FORMAT),
    });
    return formatted || String(value);
}

/** Stored enum token → card/sheet copy. Tries the raw token, then lowercase. */
function formatEnum(
    value: unknown,
    category: string | undefined,
    resolveLanguageKey: ResolveLanguageKey,
): string | null {
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
        return null;
    }
    const token = String(value).trim();
    if (!token) return null;
    if (!category) return token;
    const exact = resolveLanguageKey(`${category}.${token}`, true);
    if (typeof exact === "string" && exact.length > 0) return exact;
    const lower = token.toLowerCase();
    if (lower !== token) {
        const lowered = resolveLanguageKey(`${category}.${lower}`, true);
        if (typeof lowered === "string" && lowered.length > 0) return lowered;
    }
    return token;
}

function formatBoolean(value: unknown, resolveLanguageKey: ResolveLanguageKey): string | null {
    if (typeof value === "boolean") {
        return String(resolveLanguageKey(value ? "yes" : "no"));
    }
    if (value === "true" || value === "false") {
        return String(resolveLanguageKey(value === "true" ? "yes" : "no"));
    }
    return null;
}

function toFlagCode(value: unknown): string {
    return String(value).trim();
}

/** Calling-code prefix (`355` → `+355`). Does not format full phone numbers. */
function formatPhoneCode(value: unknown): string {
    const raw = String(value).trim();
    if (!raw) return "";
    return raw.startsWith("+") ? raw : `+${raw}`;
}

function stopLinkClick(e: MouseEvent) {
    e.stopPropagation();
}

function hrefLink(href: string, label: string): ReactNode {
    return (
        <a className="hover:underline" href={href} onClick={stopLinkClick}>
            {label}
        </a>
    );
}

type PhoneParts = {prefix?: string; number?: string};

function parsePhoneNumber(value: unknown): {href: string; display: string} | null {
    if (typeof value === "string") {
        const display = value.trim();
        if (!display) return null;
        return {href: display.replace(/[^\d+]/g, ""), display};
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
        const {prefix, number} = value as PhoneParts;
        const display = `${prefix || ""} ${number || ""}`.trim();
        if (!display) return null;
        return {href: `${prefix || ""}${number || ""}`.replace(/[^\d+]/g, ""), display};
    }
    return null;
}

function formatPhoneNumber(value: unknown): ReactNode {
    const parsed = parsePhoneNumber(value);
    if (!parsed) return String(value);
    return parsed.href ? hrefLink(`tel:${parsed.href}`, parsed.display) : parsed.display;
}

function formatEmail(value: unknown): ReactNode {
    const email = String(value).trim();
    return email ? hrefLink(`mailto:${email}`, email) : "";
}

type UserParts = {name?: string; surname?: string};

/** Populated user stub (`{name, surname}`) or a preformatted display string. */
function formatUser(value: unknown): string | null {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed || null;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
        const {name, surname} = value as UserParts;
        const display = [name, surname]
            .map((part) => (typeof part === "string" ? part.trim() : ""))
            .filter(Boolean)
            .join(" ");
        return display || null;
    }
    return null;
}

type CurrencyStub = {symbol?: string; abbreviation?: string};

function currencyLabel(value: unknown): string {
    if (typeof value === "string") return value.trim();
    if (value && typeof value === "object" && !Array.isArray(value)) {
        const {symbol, abbreviation} = value as CurrencyStub;
        const sym = typeof symbol === "string" ? symbol.trim() : "";
        if (sym) return sym;
        return typeof abbreviation === "string" ? abbreviation.trim() : "";
    }
    return "";
}

/**
 * Money amount + currency stub (`{amount, currency: {symbol, abbreviation}}`),
 * a bare amount, or a currency identity (`{symbol, abbreviation}`).
 */
function formatCurrencyValue(value: unknown): string | null {
    const amountOnly = toNumber(value);
    if (amountOnly != null && (typeof value === "number" || typeof value === "string")) {
        return formatGroupedNumber(amountOnly, 2);
    }
    // Decimal128 / numeric object treated as bare amount
    if (amountOnly != null && value != null && typeof value === "object" && !Array.isArray(value) && !("symbol" in value) && !("abbreviation" in value) && !("amount" in value) && !("number" in value) && !("currency" in value)) {
        return formatGroupedNumber(amountOnly, 2);
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
        const obj = value as CurrencyStub & {amount?: unknown; number?: unknown; currency?: unknown};
        const amount = toNumber(obj.amount ?? obj.number);
        const label = currencyLabel(obj.currency ?? {symbol: obj.symbol, abbreviation: obj.abbreviation});
        if (amount != null && label) return `${label} ${formatGroupedNumber(amount, 2)}`;
        if (amount != null) return formatGroupedNumber(amount, 2);
        if (label) return label;
    }
    return null;
}

function mediaSrc(value: unknown): string | undefined {
    if (typeof value === "string") {
        const raw = value.trim();
        if (!raw) return undefined;
        if (
            raw.startsWith("/") ||
            raw.startsWith("http://") ||
            raw.startsWith("https://") ||
            raw.startsWith("blob:")
        ) {
            return raw;
        }
        return `${MEDIA_BASE_URL}${raw}`;
    }
    if (value && typeof value === "object" && "_id" in value) {
        const id = (value as {_id?: unknown})._id;
        if (typeof id === "string" && id.trim()) return `${MEDIA_BASE_URL}${id}`;
    }
    return undefined;
}

function formatAvatar(value: unknown, size = AVATAR_SIZE): ReactNode {
    const src = mediaSrc(value);
    const iconPx = Math.max(16, Math.round((size * 20) / AVATAR_SIZE));
    return (
        <Avatar className="shrink-0 rounded-xl border-0" style={{width: size, height: size}}>
            {src ? <AvatarImage src={src} alt="" className="rounded-xl shadow-sm" /> : null}
            <AvatarFallback className="rounded-xl bg-muted/50 text-muted-foreground">
                <IconPhoto className="shadow-sm" style={{width: iconPx, height: iconPx}} />
            </AvatarFallback>
        </Avatar>
    );
}

function formatIcon(value: unknown, size = ICON_SIZE): ReactNode {
    const name = String(value).trim();
    return (
        <span
            className="flex shrink-0 items-center justify-center leading-none"
            style={{width: size, height: size, fontSize: size}}
        >
            <MdiIcon icon={name || undefined} size={1} showFallback />
        </span>
    );
}

function toNumber(value: unknown): number | null {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value === "string" && value.trim().length > 0) {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }
    // Decimal128 / BSON decimal stubs expose a numeric toString()
    if (value != null && typeof value === "object" && typeof (value as {toString?: () => string}).toString === "function") {
        const asString = (value as {toString: () => string}).toString();
        if (asString && asString !== "[object Object]") {
            const n = Number(asString);
            return Number.isFinite(n) ? n : null;
        }
    }
    return null;
}

function formatByType(
    value: unknown,
    type: DisplayValueType | undefined,
    resolveLanguageKey: ResolveLanguageKey,
    timeZone: string,
    format?: Intl.DateTimeFormatOptions,
    size?: number,
    languageKeyCategory?: string,
): ReactNode {
    if (type === "media") {
        return (
            <SheetMediaFilesStrip
                media={toMediaList(value)}
                resolveLanguageKey={resolveLanguageKey}
            />
        );
    }
    if (type === "enum") {
        return formatEnum(value, languageKeyCategory, resolveLanguageKey) ?? String(value);
    }
    if (type === "boolean") {
        return formatBoolean(value, resolveLanguageKey) ?? String(value);
    }
    if (type === "date" || type === "dateTime") {
        return formatTemporal(value, type, timeZone, format);
    }
    if (type === "flag") {
        const width = size ?? FLAG_WIDTH;
        const height = size != null ? Math.round((size * FLAG_HEIGHT) / FLAG_WIDTH) : FLAG_HEIGHT;
        return <CountryFlag code={toFlagCode(value)} width={width} height={height} />;
    }
    if (type === "icon") {
        return formatIcon(value, size);
    }
    if (type === "avatar") {
        return formatAvatar(value, size);
    }
    if (type === "phoneCode") {
        return formatPhoneCode(value);
    }
    if (type === "phoneNumber") {
        return formatPhoneNumber(value);
    }
    if (type === "email") {
        return formatEmail(value);
    }
    if (type === "user") {
        return formatUser(value) ?? String(value);
    }
    if (type === "currency") {
        return formatCurrencyValue(value) ?? String(value);
    }
    if (type === "area") {
        const n = toNumber(value);
        return n != null ? `${formatGroupedNumber(n, 2)}m²` : String(value);
    }
    if (type === "locale") {
        const n = toNumber(value);
        return n != null ? formatGroupedNumber(n) : String(value);
    }
    if (type === "number") {
        const n = toNumber(value);
        if (n == null) return String(value);
        if (Number.isInteger(n)) return formatGroupedNumber(n, 0);
        return formatNumber(n, {useGrouping: true, maximumFractionDigits: 4});
    }
    if (type === "longText") {
        return <TruncatedValue preview="popover">{String(value)}</TruncatedValue>;
    }
    if (type === "string") {
        return String(value);
    }

    if (typeof value === "boolean") {
        return formatBoolean(value, resolveLanguageKey) ?? String(value);
    }
    if (value instanceof Date) {
        return formatTemporal(value, "date", timeZone, format);
    }
    if (typeof value === "number") {
        return formatGroupedNumber(value);
    }
    if (typeof value === "string") {
        if (isDateOnlyIso(value)) return formatTemporal(value, "date", timeZone, format);
        if (value.length >= LONG_TEXT_THRESHOLD) return <TruncatedValue preview="popover">{value}</TruncatedValue>;
        return value;
    }
    return String(value);
}

/**
 * Plain-text spelling of what {@link DisplayValue} would render, for callers that need a string
 * rather than a node — truncation tooltips, copy-to-clipboard, exports.
 *
 * It exists so those callers cannot drift from the cell they describe: `DisplayRow` used to carry
 * its own copy, which formatted money with `toFixed(2)` while the cell used grouped digits, so a
 * truncated cell reading `€ 1,234.50` had a tooltip reading `€ 1234.50`.
 *
 * Types that render as an element rather than text (media, flag, icon, avatar) have no plain-text
 * form and return `""`. Enum and boolean copy needs a dictionary: pass `resolveLanguageKey` for
 * translated text, otherwise the stored token is returned.
 */
export function displayPlainText(
    value: unknown,
    type?: DisplayValueType,
    options: {
        timeZone?: string;
        format?: Intl.DateTimeFormatOptions;
        resolveLanguageKey?: ResolveLanguageKey;
        languageKeyCategory?: string;
    } = {},
): string {
    if (isEmptyValue(value)) return "";
    const {timeZone = "UTC", format, resolveLanguageKey, languageKeyCategory} = options;

    if (type === "media" || type === "flag" || type === "icon" || type === "avatar") return "";
    if (type === "date" || type === "dateTime") return formatTemporal(value, type, timeZone, format);
    if (type === "enum") {
        const translated = resolveLanguageKey
            ? formatEnum(value, languageKeyCategory, resolveLanguageKey)
            : null;
        return translated ?? String(value);
    }
    if (type === "boolean") {
        const translated = resolveLanguageKey ? formatBoolean(value, resolveLanguageKey) : null;
        return translated ?? String(value);
    }
    if (type === "currency") return formatCurrencyValue(value) ?? String(value);
    if (type === "user") return formatUser(value) ?? String(value);
    if (type === "phoneCode") return formatPhoneCode(value);
    if (type === "phoneNumber") return parsePhoneNumber(value)?.display ?? String(value);
    if (type === "email") return typeof value === "string" ? value : String(value);
    if (type === "area") {
        const n = toNumber(value);
        return n != null ? `${formatGroupedNumber(n, 2)}m²` : String(value);
    }
    if (type === "locale") {
        const n = toNumber(value);
        return n != null ? formatGroupedNumber(n) : String(value);
    }
    if (type === "number") {
        const n = toNumber(value);
        if (n == null) return String(value);
        return Number.isInteger(n)
            ? formatGroupedNumber(n, 0)
            : formatNumber(n, {useGrouping: true, maximumFractionDigits: 4});
    }
    if (type === "longText" || type === "string") return String(value);

    /* Untyped: mirror the inference `formatByType` does for a bare value. */
    if (typeof value === "boolean") {
        const translated = resolveLanguageKey ? formatBoolean(value, resolveLanguageKey) : null;
        return translated ?? String(value);
    }
    if (value instanceof Date) return formatTemporal(value, "date", timeZone, format);
    if (typeof value === "number") return formatGroupedNumber(value);
    if (typeof value === "string") {
        return isDateOnlyIso(value) ? formatTemporal(value, "date", timeZone, format) : value;
    }
    /* Structured stubs a card may hold without declaring a type. */
    if (typeof value === "object" && !Array.isArray(value)) {
        const phone = parsePhoneNumber(value);
        if (phone) return phone.display;
        const user = formatUser(value);
        if (user) return user;
        const currency = formatCurrencyValue(value);
        if (currency) return currency;
    }
    return "";
}

function wrapFormatted(
    content: ReactNode,
    render?: (formatted: ReactNode) => ReactNode,
): ReactNode {
    return render ? render(content) : content;
}

function wrap(content: ReactNode, className: string | undefined): ReactNode {
    if (!className) return content;
    return <span className={className}>{content}</span>;
}

function DisplayValue({
    value,
    path,
    type,
    languageKeyCategory,
    children,
    format,
    size,
    show: showProp,
    resource,
    className,
}: DisplayValueProps) {
    const parentResolveLanguageKey = useContext(LanguageResolveContext);
    const {currentLanguage} = useSelectedLanguage(DISPLAY_VALUE_LANG_PATH);
    const keyPathCache = useRef<Map<string, string[]>>(new Map());

    const resolveOwnLanguageKey: ResolveLanguageKey = useCallback((key: string, returnUndefinedIfNeeded: boolean = false) => {
        try {
            let cached = keyPathCache.current.get(key);
            if (!cached) {
                cached = key.split(".");
                keyPathCache.current.set(key, cached);
            }
            let returnThis: unknown = currentLanguage;
            for (let i = 0; i < cached.length; i++) {
                if (returnThis == null || typeof returnThis !== "object") {
                    throw new Error("Missing translation key");
                }
                returnThis = (returnThis as Record<string, unknown>)[cached[i]];
            }
            if (typeof returnThis !== "string") {
                if (!returnThis) {
                    throw new Error("Missing translation value");
                }
                return returnThis as TranslationValue;
            }
            return returnThis;
        } catch {
            if (returnUndefinedIfNeeded) {
                return null;
            }
            return `---${key}---`;
        }
    }, [currentLanguage]);

    /**
     * Prefer the nearest card/sheet dictionary for enums; keep this file for yes/no only.
     */
    const resolveLanguageKey: ResolveLanguageKeyImpl = useCallback((key: string, returnUndefinedIfNeeded: boolean = false) => {
        if (parentResolveLanguageKey) {
            const fromParent = parentResolveLanguageKey(key, true);
            if (fromParent != null && fromParent !== "") {
                return fromParent;
            }
        }
        return resolveOwnLanguageKey(key, returnUndefinedIfNeeded);
    }, [parentResolveLanguageKey, resolveOwnLanguageKey]);

    const contextRead = useAccessFieldsRead();
    const ownAccess = useAccess(resource ?? "");
    const read = resource ? ownAccess.read : contextRead;
    const timezone = useSelector((state: RootState) => state.authentication.user?.timezone);
    const timeZone = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    let allowed = true;
    if (showProp !== undefined) {
        allowed = showProp;
    } else if (path && (path === "statistics" || path.startsWith("statistics."))) {
        // Computed aggregates — not model ACL keys. Backend decides the payload.
        allowed = true;
    } else if (path) {
        allowed = read !== undefined && accessFieldPathExists(read, path);
    }

    if (!allowed) {
        return wrap(<HiddenElement showLock randomLength={HIDDEN_RANDOM_LENGTH} />, className);
    }

    if (
        type !== "avatar" &&
        (isEmptyValue(value) ||
            ((type === "phoneCode" || type === "flag" || type === "email" || type === "icon") && String(value).trim() === "") ||
            (type === "phoneNumber" && !parsePhoneNumber(value)) ||
            (type === "user" && !formatUser(value)) ||
            (type === "currency" && !formatCurrencyValue(value)) ||
            (type === "enum" && !formatEnum(value, languageKeyCategory, resolveLanguageKey)) ||
            (type === "media" && toMediaList(value).length === 0))
    ) {
        return wrap(<ValueNotSet />, className);
    }

    if (isValidElement(value)) {
        return wrap(wrapFormatted(value, children), className);
    }

    return wrap(
        wrapFormatted(
            formatByType(value, type, resolveLanguageKey, timeZone, format, size, languageKeyCategory),
            children,
        ),
        className,
    );
}

export default DisplayValue;
