/** Resolves access vs view-config collection keys from generic page config (supports deprecated fields). */
export function resolveEntityPageKeys(config: {
    model?: string;
    accessModel?: string;
    collectionName?: string;
}): { accessKey: string; viewCollectionKey: string } {
    return {
        accessKey: config.model ?? config.accessModel ?? config.collectionName ?? "",
        viewCollectionKey: config.collectionName ?? config.model ?? config.accessModel ?? "",
    };
}
