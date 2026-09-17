/**
 * Maps a panel pathname to the websocket site-room id the user should join.
 *
 * Contract:
 * - Prefer the leaf resource / subview (e.g. `/eCommerce/bookings` → `bookings`).
 * - Core routes that already have Room enum ids use those exact strings.
 * - Home joins `home`.
 * - Module-owned systemSettings rooms come from `siteRoomContribution` attach files.
 *
 * Every returned id should be registered by a maestro module `websocket/roomContribution.ts`
 * (display name). Joins still succeed for unregistered valid ids, but the
 * performance UI will show the raw id.
 */
import {
    getContributedPathRoomOverrides,
    getContributedSystemSettingsRooms,
} from "@baseModule/helpers/moduleContributions/loadSiteRoomContributions.ts";

const PATH_ROOM_OVERRIDES: Record<string, string> = {
    "company/administration": "administration",
    "company/users": "users",
    "company/chats": "chats",
    "company/websiteChats": "websiteChats",
    "company/info": "company",
    "account/account": "account",
    "account/security": "security",
    "account/notifications": "notifications",
    "account/notificationCenter": "notificationCenter",
    "account/apps": "connectedApps",
    "tenancy/serverPerformance": "serverPerformance",
};

/** Core-owned systemSettings resource → room id. */
const CORE_SYSTEM_SETTINGS_ROOMS: Record<string, string> = {
    companies: "companies_configurations",
    roles: "roles_configurations",
    countries: "country_configurations",
    states: "states_configurations",
    cities: "cities_configurations",
    currencies: "currencies_configurations",
    smtpServers: "smtpServers_configurations",
    messagingProviders: "messagingProviders_configurations",
};

/** Valid site-room ids: letter start, then alphanumeric / underscore, max 64 (allows camelCase slugs). */
export const SITE_ROOM_ID_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;

type RoomTables = {systemSettings: Map<string, string>; paths: Map<string, string>};

let tables: RoomTables | undefined;

/** Core entries merged with module contributions (which win). Contributions are static, so built once. */
function roomTables(): RoomTables {
    tables ??= {
        systemSettings: new Map(Object.entries({...CORE_SYSTEM_SETTINGS_ROOMS, ...getContributedSystemSettingsRooms()})),
        paths: new Map(Object.entries({...PATH_ROOM_OVERRIDES, ...getContributedPathRoomOverrides()})),
    };
    return tables;
}

const validRoom = (room: string | undefined): string | null =>
    room !== undefined && SITE_ROOM_ID_PATTERN.test(room) ? room : null;

export function resolveSiteRoomFromPath(pathname: string): string | null {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0 || segments[0] === "home") {
        return "home";
    }

    const [menu, subview, resource] = segments;
    const {systemSettings, paths} = roomTables();

    if (menu === "tenancy" && subview === "systemSettings") {
        return validRoom(resource === undefined ? undefined : systemSettings.get(resource)) ?? "activity";
    }

    const override = paths.get(subview ? `${menu}/${subview}` : menu);
    if (override !== undefined) {
        return validRoom(override);
    }

    // Module resources (bookings, listings, …) and bare menus use the URL slug.
    return validRoom(subview || menu);
}
