/**
 * Maps a panel pathname to the websocket site-room id the user should join.
 *
 * Contract:
 * - Prefer the leaf resource / subview (e.g. `/eCommerce/bookings` → `bookings`).
 * - Core routes that already have Room enum ids use those exact strings.
 * - Home joins `home`.
 *
 * Every returned id must be registered by a module `websocket/roomContribution.ts`
 * (display name). Joins still succeed for unregistered valid ids, but the
 * performance UI will show the raw id.
 */
const PATH_ROOM_OVERRIDES: Record<string, string> = {
    "company/administration": "administration",
    "company/users": "users",
    "company/chats": "chats",
    "company/info": "company",
    "account/account": "account",
    "account/security": "security",
    "account/notifications": "notifications",
    "account/notificationCenter": "notificationCenter",
    "account/apps": "connectedApps",
    "tenancy/serverPerformance": "serverPerformance",
};

/** systemSettings resource → room id (must match module roomContribution entries). */
const SYSTEM_SETTINGS_ROOMS: Record<string, string> = {
    // core
    companies: "companies_configurations",
    roles: "roles_configurations",
    countries: "country_configurations",
    states: "states_configurations",
    cities: "cities_configurations",
    currencies: "currencies_configurations",
    smtpServers: "smtpServers_configurations",
    messagingProviders: "messagingProviders_configurations",
    // propertyManagement
    unitTypes: "unitTypes_configurations",
    unitTypeCategories: "unitTypeCategories_configurations",
    constructors: "constructors_configurations",
    // eCommerce
    categories: "categories_configurations",
};

/** Valid site-room ids: letter start, then alphanumeric / underscore, max 64 (allows camelCase slugs). */
export const SITE_ROOM_ID_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;

export function resolveSiteRoomFromPath(pathname: string): string | null {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0 || segments[0] === "home") {
        return "home";
    }

    const [menu, subview, resource] = segments;

    if (menu === "tenancy" && subview === "systemSettings") {
        if (resource && SYSTEM_SETTINGS_ROOMS[resource]) {
            return SYSTEM_SETTINGS_ROOMS[resource];
        }
        return "activity";
    }

    const pathKey = subview ? `${menu}/${subview}` : menu;
    if (PATH_ROOM_OVERRIDES[pathKey]) {
        return PATH_ROOM_OVERRIDES[pathKey];
    }

    // Module resources (bookings, listings, …) and bare menus use the URL slug.
    const room = subview || menu;
    return SITE_ROOM_ID_PATTERN.test(room) ? room : null;
}
