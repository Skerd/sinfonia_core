/**
 * @fileoverview Core general-purpose helpers for config, dates, strings, and user display.
 * Used across the app for environment config, date/time formatting, random IDs, and name/breadcrumb formatting.
 */

import environmentConfig from "@coreModule/environment/environment.json";
import { ChannelUser } from "armonia/src/modules/core/types";
import type { DeletedData } from "armonia/src/modules/core/types/shared.types.ts";
import { MessageSenderType } from "armonia/src/modules/core/api/user/private/chats/messages/messages.form.response.type.ts";
import {CompanyUserType} from "armonia/src/modules/core/api/company/private/users/allUsers.form.response.type.ts";
import {ResolveLanguageKey, TranslationValue} from "@coreModule/helpers/hocs/withLanguage.tsx";

type ClientConfig = typeof environmentConfig;
type DatePartKey = "day" | "month" | "year" | "hour" | "minute" | "second";

/** Default Intl date format options used by {@link formatDate}. */
const DEFAULT_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

/**
 * Returns the application client configuration (environment).
 *
 * @returns The loaded environment config object.
 */
export function getClientConfig(): ClientConfig {
  return environmentConfig;
}

/**
 * Formats a UTC date string into a fixed DD/MM/YYYY HH:mm:ss string in the given timezone.
 *
 * @param dateString - ISO or parseable UTC date string.
 * @param timezone - IANA timezone (e.g. `"Europe/London"`).
 * @returns Formatted string like `"09/03/2025 14:30:00"`, or invalid date string if parsing fails.
 */
export function manipulateDate(dateString: string, timezone: string): string {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const format: Record<DatePartKey, string> = {
    day: "",
    month: "",
    year: "",
    hour: "",
    minute: "",
    second: "",
  };

  for (const { type, value } of parts) {
    if (type in format) (format as Record<string, string>)[type] = value;
  }

  return `${format.day}/${format.month}/${format.year} ${format.hour}:${format.minute}:${format.second}`;
}

/**
 * Generates a random alphanumeric string of the given length.
 * Uses `crypto.getRandomValues` when available for stronger randomness; falls back to `Math.random`.
 *
 * @param length - Desired length. If &lt;= 0, returns `""`.
 * @returns A string of characters from a fixed alphanumeric charset.
 */
export function generateRandomString(length: number): string {
  if (length <= 0) return "";

  const charset = "MdgvJe1soP4jGFwzy5XQRDmHILN8huAiSn7BxUTrlWECtKZafcb2Vq03kOYp96";

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    return Array.from(randomValues, (n) => charset[n % charset.length]).join("");
  }

  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

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

/**
 * Options for {@link formatDate}.
 */
export interface FormatDateOptions {
  /** IANA timezone; defaults to the runtime's default timezone. */
  timeZone?: string;
  /** Intl date/time format overrides; merged with defaults (weekday, day, month, year, hour, minute). */
  format?: Intl.DateTimeFormatOptions;
}

/**
 * Formats a date using the runtime locale and optional timezone/format.
 *
 * @param date - Date instance, ISO string, or timestamp.
 * @param options - Optional timezone and format overrides.
 * @returns Formatted date string, or `""` if `date` is falsy or invalid.
 */
export function formatDate(
  date: Date | string | number,
  options?: FormatDateOptions
): string {
  if (!date) return "";

  const {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
    format = DEFAULT_FORMAT_OPTIONS,
  } = options ?? {};

  const formatter = new Intl.DateTimeFormat(undefined, {
    timeZone,
    hourCycle: "h23",
    ...format,
  });
  return formatter.format(new Date(date));
}

/**
 * Returns whether two dates fall on the same calendar day (local time).
 *
 * @param d1 - First date.
 * @param d2 - Second date.
 * @returns `true` if same year, month, and date.
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Builds a display name from a user-like object (channel user, message sender, or deleted-by).
 * Prefers `fullName`; otherwise concatenates `name` and `surname` with a space.
 *
 * @param user - Object with optional `name`, `surname`, or `fullName`.
 * @returns Non-null display name string; `""` if `user` is falsy or has no name fields.
 */
export function getName(
  user: ChannelUser | MessageSenderType | DeletedData["deletedBy"] | CompanyUserType
): string {
  if (!user) return "";

  const { name, surname } = user;

  if( !!name && !!surname ){
    return `${name} ${surname}`
  }
  const parts = [name, surname].filter(Boolean) as string[];
  return parts.join(" ").trim();
}

/**
 * Formats a duration in milliseconds as a human-readable string (e.g. "2 days, 3 hours" or "45 minutes").
 * Uses the provided `resolveLanguageKey` for i18n of unit labels (e.g. "day", "days", "hour", "hours").
 *
 * @param ms - Duration in milliseconds.
 * @param resolveLanguageKey - Function that maps unit keys to localized strings.
 * @returns Formatted string with the largest applicable units (days+hours, hours, minutes, or seconds).
 */
export function formatDurationInDaysHoursOrMinutes(
  ms: number,
  resolveLanguageKey: ResolveLanguageKey
): string {
  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hoursRem = totalHours % 24;

  if (days > 0) {
    const dayLabel = resolveLanguageKey(days === 1 ? "day" : "days");
    const hourLabel = resolveLanguageKey(hoursRem === 1 ? "hour" : "hours");
    return `${days} ${dayLabel}, ${hoursRem} ${hourLabel}`;
  }
  if (totalHours > 0) {
    const label = resolveLanguageKey(totalHours === 1 ? "hour" : "hours");
    return `${totalHours} ${label}`;
  }
  if (totalMinutes > 0) {
    const label = resolveLanguageKey(totalMinutes === 1 ? "minute" : "minutes");
    return `${totalMinutes} ${label}`;
  }
  const label = resolveLanguageKey(totalSeconds === 1 ? "second" : "seconds");
  return `${totalSeconds} ${label}`;
}

/**
 * Builds a document/page title by appending a breadcrumb of segments.
 *
 * @param title - Base title (e.g. app or section name).
 * @param items - Breadcrumb segments; falsy entries are omitted.
 * @returns `title` when no items, otherwise `"title: item1 / item2 / ..."`.
 */
export function buildTitleBreadcrumb(title: string, items: (string | undefined)[]): string {
  const filteredItems = items.filter((item) => Boolean(item));
  if (filteredItems.length === 0) return title;
  return `${title}: ${filteredItems.join(" / ")}`;
}

export function findFromLanguage(values: TranslationValue, path: string): TranslationValue{
  let tempValue = values;
  for( let part of path.split(".") ){
    if( tempValue?.[part] ){
      tempValue = tempValue[part];
    }else{
      return path;
    }
  }
  return tempValue;
}

export function findFromObject(values: any, path: string): any{
  let tempValue = values;
  for( let part of path.split(".") ){
    if( tempValue?.[part] !== undefined ){
      tempValue = tempValue[part];
    }else{
      return `!! [${path}] not found in object !!`;
    }
  }
  return tempValue;
}

export function notificationDateFormatter(dateStr: string, resolveLanguageKey: ResolveLanguageKey): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return resolveLanguageKey("justNow");
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      const template = resolveLanguageKey("minutesAgo", true);
      const unit = resolveLanguageKey("minutesAgoUnit", true);
      return (typeof template === "string" ? template.replace("{}", String(mins)) : null)
          ?? (typeof unit === "string" ? `${mins}${unit}` : null)
          ?? d.toLocaleDateString();
    }
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      const template = resolveLanguageKey("hoursAgo", true);
      const unit = resolveLanguageKey("hoursAgoUnit", true);
      return (typeof template === "string" ? template.replace("{}", String(hours)) : null)
          ?? (typeof unit === "string" ? `${hours}${unit}` : null)
          ?? d.toLocaleDateString();
    }
    return d.toLocaleDateString();
}


type QueryValue = string | number | boolean | null | undefined;

export function buildUrlWithExistingParams(currentUrl: string, newBasePath: string, extraParams: Record<string, QueryValue> = {}) {
  const url = new URL(currentUrl);

  const params = new URLSearchParams(url.search);

  Object.entries(extraParams).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });

  return `${newBasePath}?${params.toString()}`;
}