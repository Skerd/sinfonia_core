export type EntityPageKeyConfig = {
    model?: string;
    accessModel?: string;
    collectionName?: string;
};

/**
 * Resolves the access-map key and the view-config collection key of a generic entity page.
 * `model` wins for access, `collectionName` for view configs; each falls back to the others.
 */
export function resolveEntityPageKeys(config: EntityPageKeyConfig): {accessKey: string; viewCollectionKey: string} {
    return {
        accessKey: config.model ?? config.accessModel ?? config.collectionName ?? "",
        viewCollectionKey: config.collectionName ?? config.model ?? config.accessModel ?? "",
    };
}
