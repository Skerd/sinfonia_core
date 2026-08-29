import type {ViewConfig} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {
    TableColumnConfig,
} from "armonia/src/modules/core/api/company/private/users/tableConfig.form.response.type";

/**
 * Studio drafts — edits that have not been exported back into source yet.
 *
 * Deliberately client-only. `*.views.ts` and the Mongoose `dynamicTableConfiguration`
 * blocks stay the single source of truth; a draft is an overlay that the Studio
 * previews through the existing {@link import("@coreModule/helpers/context/viewConfigMergeContext.tsx").ViewConfigMergeProvider}
 * and then prints as TypeScript for a human to reconcile.
 */

const STORAGE_KEY = "studio:draft:v1";

export type StudioDrafts = {
    /** `"<collection>:<viewKey>"` (see {@link viewDraftKey}) → edited config. */
    views: Record<string, ViewConfig>;
    /** Collection name (e.g. `"countries"`) → edited column list. */
    tables: Record<string, TableColumnConfig[]>;
};

export const EMPTY_DRAFTS: StudioDrafts = {views: {}, tables: {}};

/**
 * `ViewConfigContext` lowercases the model before lookup, so the draft key must
 * too — otherwise a draft saved under "Countries" never matches "countries".
 */
export function viewDraftKey(model: string, viewKey: string): string {
    return `${model.toLowerCase()}:${viewKey}`;
}

export function tableDraftKey(collection: string): string {
    return collection.toLowerCase();
}

function isViewConfigLike(value: unknown): value is ViewConfig {
    if (value == null || typeof value !== "object") return false;
    const candidate = value as Partial<ViewConfig>;
    return typeof candidate.model === "string" && Array.isArray(candidate.nodes);
}

/**
 * Reads persisted drafts, dropping anything that no longer parses as a config.
 * Storage is written by a previous build of the Studio, so it is an untrusted
 * boundary — unlike the API payloads, which `filterViewConfig` has already shaped.
 */
export function loadDrafts(): StudioDrafts {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return EMPTY_DRAFTS;
        const parsed = JSON.parse(raw) as Partial<StudioDrafts>;

        const views: Record<string, ViewConfig> = {};
        for (const [key, value] of Object.entries(parsed.views ?? {})) {
            if (isViewConfigLike(value)) views[key] = value;
        }

        const tables: Record<string, TableColumnConfig[]> = {};
        for (const [key, value] of Object.entries(parsed.tables ?? {})) {
            if (Array.isArray(value)) tables[key] = value as TableColumnConfig[];
        }

        return {views, tables};
    } catch {
        return EMPTY_DRAFTS;
    }
}

export type SaveResult = {ok: true} | {ok: false; error: string};

/**
 * Browsers signal a full quota with a `DOMException` (`QuotaExceededError`), which is not
 * an `instanceof Error` everywhere — so read the name and message directly rather than
 * flattening the one failure that actually matters into a generic string.
 */
function describeStorageError(error: unknown): string {
    if (typeof error === "object" && error !== null) {
        const {name, message} = error as {name?: unknown; message?: unknown};
        const parts = [name, message].filter((part): part is string => typeof part === "string" && part !== "");
        if (parts.length > 0) return [...new Set(parts)].join(": ");
    }
    return "Could not write to localStorage";
}

/**
 * Persists drafts, reporting failure instead of swallowing it.
 *
 * The previous version caught and discarded the error, so a developer whose storage quota
 * was full kept editing against an in-memory copy that would vanish on reload, with no
 * signal at all. Losing a session's work silently is worse than any amount of noise, so the
 * caller is told and surfaces it.
 */
export function saveDrafts(drafts: StudioDrafts): SaveResult {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
        return {ok: true};
    } catch (error) {
        return {ok: false, error: describeStorageError(error)};
    }
}

export function clearStoredDrafts(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        /* ignore */
    }
}

export function draftCount(drafts: StudioDrafts): number {
    return Object.keys(drafts.views).length + Object.keys(drafts.tables).length;
}
