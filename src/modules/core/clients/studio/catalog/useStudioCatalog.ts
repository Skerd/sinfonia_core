import {useMemo} from "react";
import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {
    TableColumnConfig,
} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type";
import {useViewConfigContext} from "@coreModule/helpers/context/viewConfigContext.tsx";
import {useTableConfigContext} from "@coreModule/helpers/context/tableConfigContext.tsx";
import {useAccessMap} from "@coreModule/helpers/hocs/withAccess.tsx";
import {useStudioDrafts} from "../draft/studioDraftProvider.tsx";
import {moduleForModel, type StudioModuleId} from "./studioModules.ts";
import {STUDIO_PREVIEW_KEY_PREFIX} from "../studioTarget.ts";

/**
 * The Studio's model catalog.
 *
 * Assembled entirely from data the guard's HOCs have already fetched — there is no
 * Studio endpoint and no new Maestro surface:
 *
 *  - `withViewConfig`  → `GET /api/auxiliary/viewConfigs`   → sheet / form trees
 *  - `withTableConfig` → `GET /api/auxiliary/tableConfigs`  → column configs
 *  - `withAccess`      → `POST /api/user/permissions/access/all` → readable / writable paths
 *
 * All three are keyed by the Mongoose collection name (`countries`, `units`), which is
 * also the `tableConfigKey` and the `model` on a `ViewConfig`.
 */

/** Ordered so the UI always lists views the same way, whatever the API returns. */
export const STUDIO_VIEW_KEYS = ["sheet", "form:create", "form:edit"] as const;

export type StudioViewKey = string;

export type StudioModelEntry = {
    /** Mongoose collection name, lowercase. The key for every lookup. */
    collection: string;
    /** Owning module, derived from the view's `apiUrl` namespace. See `studioModules.ts`. */
    module: StudioModuleId;
    /**
     * Every view key for this model, ordered by {@link STUDIO_VIEW_KEYS} first.
     *
     * Includes keys that exist only as a draft: a model with no `*.views.ts` has nothing to
     * serve, so a newly created view would otherwise be invisible in the catalog that is
     * supposed to open it.
     */
    viewKeys: StudioViewKey[];
    views: Record<StudioViewKey, ViewConfig>;
    columns: TableColumnConfig[];
    /** Dotted paths the current user may read — the field picker's option list. */
    readPaths: string[];
    /** Dotted paths the current user may write. */
    writePaths: string[];
    /** From the `ViewConfig` itself; `undefined` when the model has no view config. */
    apiUrl?: string;
    accessModel?: string;
    canCreate: boolean;
    canDelete: boolean;
};

export type StudioCatalog = {
    entries: StudioModelEntry[];
    /** `undefined` until both prefetches have settled. */
    isHydrated: boolean;
    byCollection: Record<string, StudioModelEntry>;
};

/**
 * Flattens a `ReadOrWriteFields` tree into dotted paths (`currency.abbreviation`).
 * Mirrors the walk `hasField` does server-side in `viewConfigs.ts` and `hasAccessPath`
 * does client-side, so a path offered here is a path the engine can actually gate on.
 */
export function collectAccessPaths(fields: unknown, prefix = ""): string[] {
    if (fields == null || typeof fields !== "object") return [];

    const result: string[] = [];
    for (const [key, value] of Object.entries(fields as Record<string, unknown>)) {
        const path = prefix ? `${prefix}.${key}` : key;
        result.push(path);
        const nested = (value as {keys?: unknown} | null)?.keys;
        if (nested && typeof nested === "object") {
            result.push(...collectAccessPaths(nested, path));
        }
    }
    return result;
}

function orderViewKeys(keys: string[]): string[] {
    const known = STUDIO_VIEW_KEYS.filter((key) => keys.includes(key));
    const rest = keys.filter((key) => !STUDIO_VIEW_KEYS.includes(key as never)).sort();
    return [...known, ...rest];
}

export function useStudioCatalog(): StudioCatalog {
    const viewCtx = useViewConfigContext();
    const tableCtx = useTableConfigContext();
    const accessMap = useAccessMap();
    const {drafts} = useStudioDrafts();

    const viewConfigs = viewCtx?.configs;
    const tableConfigs = tableCtx?.configs;
    const isHydrated = !!viewCtx?.isHydrated && !!tableCtx?.isHydrated;

    return useMemo<StudioCatalog>(() => {
        const collections = new Set<string>(
            [...Object.keys(viewConfigs ?? {}), ...Object.keys(tableConfigs ?? {})]
                /* The table editor writes its live preview into `TableConfigContext` under a
                   `__studio:` key so it never clobbers the served config. Those entries are
                   the Studio's own scratch space, not models. */
                .filter((key) => !key.startsWith(STUDIO_PREVIEW_KEY_PREFIX)),
        );

        /* Drafted views, grouped by collection — `"<collection>:<viewKey>"`. */
        const draftedByCollection = new Map<string, Record<string, ViewConfig>>();
        for (const [key, config] of Object.entries(drafts.views)) {
            const separator = key.indexOf(":");
            if (separator < 0) continue;
            const collection = key.slice(0, separator);
            const viewKey = key.slice(separator + 1);
            const existing = draftedByCollection.get(collection) ?? {};
            existing[viewKey] = config;
            draftedByCollection.set(collection, existing);
            collections.add(collection);
        }

        const entries: StudioModelEntry[] = [];
        for (const raw of collections) {
            const collection = raw.toLowerCase();
            const drafted = draftedByCollection.get(collection) ?? {};
            const views = {...(viewConfigs?.[collection] ?? {}), ...drafted};
            const viewKeys = orderViewKeys(Object.keys(views));
            const table = tableConfigs?.[collection];
            const access = accessMap[collection]?.self;

            /*
             * `accessModel` and `apiUrl` are carried on the ViewConfig itself, so a model
             * that has any view is fully self-describing — no lookup table needed.
             */
            const anyView = viewKeys.length > 0 ? views[viewKeys[0]!] : undefined;

            entries.push({
                collection,
                module: moduleForModel(collection, anyView?.apiUrl),
                viewKeys,
                views,
                columns: table?.columns ?? [],
                readPaths: collectAccessPaths(
                    typeof access?.read === "object" ? access.read : undefined,
                ),
                writePaths: collectAccessPaths(
                    typeof access?.write === "object" ? access.write : undefined,
                ),
                apiUrl: anyView?.apiUrl,
                accessModel: anyView?.accessModel ?? collection,
                canCreate: access?.create === true,
                canDelete: access?.delete === true,
            });
        }

        entries.sort((a, b) => a.collection.localeCompare(b.collection));

        const byCollection: Record<string, StudioModelEntry> = {};
        for (const entry of entries) {
            byCollection[entry.collection] = entry;
        }

        return {entries, isHydrated, byCollection};
    }, [viewConfigs, tableConfigs, accessMap, isHydrated, drafts]);
}
