import {useMemo} from "react";
import type {SystemMapModelNode} from "./systemMap.types.ts";
import {CLUSTER_META} from "./clusterMeta.ts";

type NodeDetailPanelProps = {
    node: SystemMapModelNode | null;
    onClose: () => void;
};

export function NodeDetailPanel({node, onClose}: NodeDetailPanelProps) {
    const meta = useMemo(() => (node ? CLUSTER_META[node.cluster] : null), [node]);

    if (!node || !meta) {
        return (
            <aside className="w-80 shrink-0 border-l bg-muted/20 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Model details</p>
                <p>Click a node on the graph to inspect fields, actions, and API paths.</p>
            </aside>
        );
    }

    return (
        <aside className="w-80 shrink-0 border-l bg-background overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b bg-background px-4 py-3">
                <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide" style={{color: meta.color}}>
                        {meta.label} · {node.module}
                    </div>
                    <h3 className="text-base font-semibold leading-tight mt-0.5">{node.label}</h3>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground text-lg leading-none px-1"
                    aria-label="Close"
                >
                    ×
                </button>
            </div>

            <div className="flex flex-col gap-4 p-4 text-sm">
                <p className="text-muted-foreground leading-relaxed">{node.description}</p>

                <section>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                        Key fields
                    </h4>
                    <ul className="flex flex-wrap gap-1.5">
                        {node.keyFields.map((field) => (
                            <li
                                key={field}
                                className="rounded border bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-foreground"
                            >
                                {field}
                            </li>
                        ))}
                    </ul>
                </section>

                {node.actions && node.actions.length > 0 && (
                    <section>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                            Actions
                        </h4>
                        <ul className="flex flex-col gap-1">
                            {node.actions.map((action) => (
                                <li key={action} className="font-mono text-[11px] text-foreground">
                                    {action}()
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {node.apiPath && (
                    <section>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                            API
                        </h4>
                        <code className="block rounded border bg-muted/40 px-2 py-1.5 text-[11px] break-all">
                            {node.apiPath}
                        </code>
                    </section>
                )}

                {node.panelRoute && (
                    <section>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                            Panel
                        </h4>
                        <a
                            href={node.panelRoute}
                            className="text-[12px] text-blue-700 hover:underline break-all"
                        >
                            {node.panelRoute}
                        </a>
                    </section>
                )}
            </div>
        </aside>
    );
}
