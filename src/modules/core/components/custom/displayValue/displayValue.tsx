import {isValidElement, type MouseEvent, type ReactNode} from "react";
import {useSelector} from "react-redux";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import {LongText} from "@coreModule/components/custom/longText.tsx";
import CountryFlag from "@coreModule/components/custom/countryFlag.tsx";
import {MdiIcon} from "@coreModule/components/custom/mdiIcons/mdiIcon.tsx";
import {Avatar, AvatarFallback, AvatarImage} from "@coreModule/components/ui/avatar.tsx";
import {IconPhoto} from "@tabler/icons-react";
import {accessFieldPathExists, useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import {useAccessFieldsRead} from "./accessFields.tsx";
import {formatDate} from "@coreModule/helpers/general";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import withLanguage, {type ResolveLanguageKey, type WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";

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
    | "enum";

type DisplayValueProps = WithLanguageType & {
    value: unknown;
    /** ACL dotted path (`area`, `unitType.name`). Walks nested `keys` via `accessFieldPathExists`. */
    path?: string;
    type?: DisplayValueType;
    /**
     * Prefix for `type="enum"` (`fields.!enums.status` + `pending` →
     * `fields.!enums.status.pending`). Same name as sheet `widgetProps.languageKeyCategory`.
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

const HIDDEN_RANDOM_LENGTH = 8;
const LONG_TEXT_THRESHOLD = 800;
const DATE_ONLY_ISO = /^\d{4}-\d{2}-\d{2}$/;
const FLAG_WIDTH = 24;
const FLAG_HEIGHT = 18;
const ICON_SIZE = 18;
const AVATAR_SIZE = 48;
const MEDIA_BASE = "/api/auxiliary/media/";

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

function formatGroupedNumber(value: number, fractionDigits?: number): string {
    if (!Number.isFinite(value)) return "";
    return value.toLocaleString(undefined, {
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
 * `YYYY-MM-DD` is a calendar date (UTC midnight). Formatting it in the user
 * timezone can shift the day; keep UTC so the printed date matches the string.
 * Instants (`Date`, ISO datetime) use the signed-in user's timezone.
 */
function formatTemporal(
    value: unknown,
    mode: "date" | "dateTime",
    timeZone: string,
    format?: Intl.DateTimeFormatOptions,
): string {
    const dateOnly = typeof value === "string" && isDateOnlyIso(value);
    const d = toDate(value);
    if (!d) return String(value);
    const formatted = formatDate(d, {
        timeZone: dateOnly && mode === "date" ? "UTC" : timeZone,
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
        return `${MEDIA_BASE}${raw}`;
    }
    if (value && typeof value === "object" && "_id" in value) {
        const id = (value as {_id?: unknown})._id;
        if (typeof id === "string" && id.trim()) return `${MEDIA_BASE}${id}`;
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
        return Number.isInteger(n) ? formatGroupedNumber(n, 0) : formatGroupedNumber(n, 2);
    }
    if (type === "longText") {
        return <LongText>{String(value)}</LongText>;
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
        if (value.length >= LONG_TEXT_THRESHOLD) return <LongText>{value}</LongText>;
        return value;
    }
    return String(value);
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
    resolveLanguageKey,
}: DisplayValueProps) {
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
        return wrap(<HiddenElement randomLength={HIDDEN_RANDOM_LENGTH} />, className);
    }

    if (
        type !== "avatar" &&
        (isEmptyValue(value) ||
            ((type === "phoneCode" || type === "flag" || type === "email" || type === "icon") && String(value).trim() === "") ||
            (type === "phoneNumber" && !parsePhoneNumber(value)) ||
            (type === "user" && !formatUser(value)) ||
            (type === "currency" && !formatCurrencyValue(value)) ||
            (type === "enum" && !formatEnum(value, languageKeyCategory, resolveLanguageKey)))
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

export default withLanguage("src/modules/core/components/custom/displayValue/displayValue.tsx")(DisplayValue);
