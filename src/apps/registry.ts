/** Registered Sinfonia clients under `src/apps/<id>/`. */
export const SINFONIA_APP_IDS = ["core", "development", "public"] as const;

export type SinfoniaAppId = (typeof SINFONIA_APP_IDS)[number];

export const DEFAULT_SINFONIA_APP_ID: SinfoniaAppId = "core";

export function isSinfoniaAppId(id: string): id is SinfoniaAppId {
    return (SINFONIA_APP_IDS as readonly string[]).includes(id);
}

export function resolveSinfoniaAppId(raw: string | undefined): SinfoniaAppId {
    const id = raw?.trim() || DEFAULT_SINFONIA_APP_ID;
    if (!isSinfoniaAppId(id)) {
        throw new Error(
            `Unknown Sinfonia client "${id}". Add src/apps/${id}/ (with index.html and entry) and register the id in src/apps/registry.ts.`,
        );
    }
    return id;
}
