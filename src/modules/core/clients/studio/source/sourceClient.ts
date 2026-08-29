import {useCallback, useEffect, useMemo, useState} from "react";
import {studioTargetKey} from "../studioTarget.ts";

/**
 * Client for the dev-server routes in `scripts/studioSourcePlugin.ts`.
 *
 * Everything here degrades to "unavailable" rather than failing: the routes exist only
 * under `npm run studio`, and the Studio must stay usable without them — a developer
 * running it against a checkout with no maestro beside it still gets the whole editor,
 * just without jump-to-source and Apply.
 */

export type SourceNodeRef = {
    file: string;
    start: number;
    end: number;
    line: number;
    column: number;
    sharedVia?: {name: string; file: string; usedBy: string[]};
};

export type SourceTargetEntry = {
    key: string;
    model: string;
    viewKey: string;
    file: string;
    declName: string;
    nodesFile: string;
    nodesIdentifier?: string;
    nodeCount: number;
    addressable: boolean;
    unaddressableReason?: string;
};

export type SourceIndexPayload = {
    targets: SourceTargetEntry[];
    sharedGroups: string[][];
    files: number;
};

export type SourceEdit =
    | {kind: "setProperty"; nodePath: string; property: string; value: unknown}
    | {kind: "removeProperty"; nodePath: string; property: string};

export type ApplyOutcome = {
    edit: SourceEdit;
    status: "applied" | "skipped";
    reason?: string;
};

export type ApplyResponse = {
    ok: boolean;
    error?: string;
    sharedWith?: string[];
    file?: string;
    backupFile?: string;
    outcomes: ApplyOutcome[];
};

export const targetKey = studioTargetKey;

/** `vscode://` link that opens the file at the node. */
export function editorLink(ref: SourceNodeRef): string {
    return `vscode://file/${ref.file}:${ref.line}:${ref.column}`;
}

/** Trims an absolute path down to something readable in a header. */
export function shortPath(file: string): string {
    const parts = file.split("/");
    return parts.slice(-1)[0] ?? file;
}

async function getJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return (await response.json()) as T;
}

export type SourceIndexState = {
    index: SourceIndexPayload | null;
    /** False when the dev-server routes are not mounted — the normal production case. */
    available: boolean;
    loading: boolean;
    error: string | null;
    byTarget: Map<string, SourceTargetEntry>;
    /** Every target sharing this one's node array, including itself. Empty when unshared. */
    sharedWith: (key: string) => string[];
};

export function useSourceIndex(): SourceIndexState {
    const [index, setIndex] = useState<SourceIndexPayload | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        getJson<SourceIndexPayload>("/__studio/index")
            .then((payload) => {
                if (!cancelled) setIndex(payload);
            })
            .catch((cause: unknown) => {
                if (!cancelled) {
                    setError(cause instanceof Error ? cause.message : "Source index unavailable");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const byTarget = useMemo(() => {
        const map = new Map<string, SourceTargetEntry>();
        for (const entry of index?.targets ?? []) map.set(entry.key, entry);
        return map;
    }, [index]);

    const sharedWith = useCallback(
        (key: string) => index?.sharedGroups.find((group) => group.includes(key)) ?? [],
        [index],
    );

    return {
        index,
        available: !!index,
        loading,
        error,
        byTarget,
        sharedWith,
    };
}

/** Resolves one node path to a source range. Returns null when unavailable. */
export async function resolveNode(
    target: string,
    nodePath: string,
): Promise<SourceNodeRef | null> {
    try {
        const response = await fetch("/__studio/resolve", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({target, nodePath}),
        });
        if (!response.ok) return null;
        const body = (await response.json()) as {ref: SourceNodeRef | null};
        return body.ref;
    } catch {
        return null;
    }
}

export async function applyToSource(request: {
    target: string;
    edits: SourceEdit[];
    confirmShared?: boolean;
    dryRun?: boolean;
}): Promise<ApplyResponse> {
    try {
        const response = await fetch("/__studio/apply", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(request),
        });
        return (await response.json()) as ApplyResponse;
    } catch (cause) {
        return {
            ok: false,
            error: cause instanceof Error ? cause.message : "Could not reach the dev server",
            outcomes: [],
        };
    }
}

/**
 * Turns the Studio's own change list into source edits.
 *
 * Only property-level changes translate: `diffNodeTrees` reports adds, removes and moves as
 * whole-node operations, and splicing nodes in source is a different (and riskier) job than
 * setting a key. Those are returned as `unsupported` so the UI can keep showing them in the
 * change list for the developer to apply by hand, rather than pretending they were handled.
 */
export function editsFromChangedNodes(
    changed: {path: string; keys: string[]; node: Record<string, unknown>}[],
): SourceEdit[] {
    const edits: SourceEdit[] = [];
    for (const entry of changed) {
        for (const key of entry.keys) {
            const value = entry.node[key];
            if (value === undefined) {
                edits.push({kind: "removeProperty", nodePath: entry.path, property: key});
            } else {
                edits.push({kind: "setProperty", nodePath: entry.path, property: key, value});
            }
        }
    }
    return edits;
}
