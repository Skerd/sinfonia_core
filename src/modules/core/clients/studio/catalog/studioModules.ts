/**
 * Which module a catalog model belongs to, and how the catalog pane groups them.
 *
 * Nothing the Studio is served carries a module: `viewConfigs` and `tableConfigs` are both
 * keyed by Mongoose collection name only, and the models themselves are registered with
 * `addModelData(model, views)` in maestro — a side effect of importing the schema file, with
 * no module argument. The one module-shaped thing that does reach the client is the
 * `ViewConfig.apiUrl`, whose namespace (`/api/realEstate/unit` → `realEstate`) is exactly the
 * router a module mounts. That is what the grouping reads.
 *
 * The module ids match maestro's `modules/*` and sinfonia's `src/modules/*` directory names,
 * the same ids `VITE_ENABLED_MODULES` accepts.
 */

export type StudioModuleId = string;

export type StudioModule = {
    id: StudioModuleId;
    label: string;
};

/** Fallback bucket, listed last. */
export const OTHER_MODULE_ID = "other";

/** Group order in the pane; anything unlisted sorts after these, before `other`. */
export const STUDIO_MODULES: StudioModule[] = [
    {id: "core", label: "Core"},
    {id: "finance", label: "Finance"},
    {id: "propertyManagement", label: "Property management"},
    {id: "eCommerce", label: "eCommerce"},
    {id: "eCommerceMarketplace", label: "Marketplace"},
    {id: "swissOutreach", label: "Swiss outreach"},
    {id: "musicIndustry", label: "Music industry"},
    {id: OTHER_MODULE_ID, label: "Other"},
];

/**
 * API namespace (second path segment of `apiUrl`) → module.
 *
 * `realEstate` is the router name property-management kept; `auxiliary`, `company` and `user`
 * are core's three. Add a line here when a module mounts a new namespace.
 */
const MODULE_BY_API_NAMESPACE: Record<string, StudioModuleId> = {
    auxiliary: "core",
    company: "core",
    user: "core",
    finance: "finance",
    realEstate: "propertyManagement",
    eCommerce: "eCommerce",
    eCommerceMarketplace: "eCommerceMarketplace",
    swissOutreach: "swissOutreach",
    musicIndustry: "musicIndustry",
};

/**
 * Models with no `*.views.ts` at all: they reach the catalog through `tableConfigs` only, so
 * there is no `apiUrl` to read a namespace from. All six are core infrastructure. A model
 * added without views elsewhere lands in `other` until it is listed here or gains a view.
 */
const MODULE_BY_COLLECTION: Record<string, StudioModuleId> = {
    channels: "core",
    cronexecutions: "core",
    messages: "core",
    notifications: "core",
    roles: "core",
    users: "core",
};

export function moduleLabel(id: StudioModuleId): string {
    return STUDIO_MODULES.find((module) => module.id === id)?.label ?? id;
}

/** Position in {@link STUDIO_MODULES}; unknown ids sort between the known ones and `other`. */
export function moduleOrder(id: StudioModuleId): number {
    const index = STUDIO_MODULES.findIndex((module) => module.id === id);
    if (index >= 0) return index === STUDIO_MODULES.length - 1 ? Number.MAX_SAFE_INTEGER : index;
    return STUDIO_MODULES.length;
}

/** `/api/realEstate/unit/sale` → `realEstate`. */
export function apiNamespace(apiUrl: string | undefined): string | undefined {
    if (!apiUrl) return undefined;
    const segments = apiUrl.split("/").filter(Boolean);
    return segments[0] === "api" ? segments[1] : segments[0];
}

export function moduleForModel(collection: string, apiUrl?: string): StudioModuleId {
    const namespace = apiNamespace(apiUrl);
    const fromApi = namespace ? MODULE_BY_API_NAMESPACE[namespace] : undefined;
    return fromApi ?? MODULE_BY_COLLECTION[collection.toLowerCase()] ?? OTHER_MODULE_ID;
}

export type StudioModuleGroup<T> = {
    id: StudioModuleId;
    label: string;
    entries: T[];
};

/**
 * Groups catalog entries by module, groups in {@link STUDIO_MODULES} order and entries in the
 * order given (the catalog sorts them by collection name). Empty groups are dropped.
 */
export function groupByModule<T extends {collection: string; module: StudioModuleId}>(
    entries: readonly T[],
): StudioModuleGroup<T>[] {
    const byModule = new Map<StudioModuleId, T[]>();
    for (const entry of entries) {
        const list = byModule.get(entry.module);
        if (list) list.push(entry);
        else byModule.set(entry.module, [entry]);
    }

    return [...byModule.entries()]
        .sort(([a], [b]) => moduleOrder(a) - moduleOrder(b) || a.localeCompare(b))
        .map(([id, list]) => ({id, label: moduleLabel(id), entries: list}));
}
