import {useCallback, useEffect, useMemo, useState} from "react";
import {
    Background,
    Controls,
    MarkerType,
    MiniMap,
    ReactFlow,
    type Edge,
    type Node,
    type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {CLUSTER_META} from "./clusterMeta.ts";
import type {SystemMapCluster, SystemMapDataset, SystemMapModelNode} from "./systemMap.types.ts";
import {ModelNode} from "./nodes.tsx";
import {NodeDetailPanel} from "./NodeDetailPanel.tsx";

const nodeTypes = {model: ModelNode};

type ModelGraphProps = {
    dataset: SystemMapDataset;
    onSelectModel?: (node: SystemMapModelNode | null) => void;
};

export function ModelGraph({dataset, onSelectModel}: ModelGraphProps) {
    const {nodes: modelNodes, edges: modelEdges, clusters} = dataset;
    const [activeClusters, setActiveClusters] = useState<Set<SystemMapCluster>>(
        () => new Set(clusters),
    );
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        setActiveClusters(new Set(clusters));
        setSelectedId(null);
        setSearch("");
    }, [clusters]);

    const modelById = useMemo(() => {
        const map = new Map<string, SystemMapModelNode>();
        for (const n of modelNodes) map.set(n.id, n);
        return map;
    }, [modelNodes]);

    const toggleCluster = (cluster: SystemMapCluster) => {
        setActiveClusters((prev) => {
            const next = new Set(prev);
            if (next.has(cluster)) {
                if (next.size > 1) next.delete(cluster);
            } else {
                next.add(cluster);
            }
            return next;
        });
    };

    const visibleIds = useMemo(() => {
        const q = search.trim().toLowerCase();
        return new Set(
            modelNodes
                .filter((n) => {
                    if (!activeClusters.has(n.cluster)) return false;
                    if (!q) return true;
                    return (
                        n.label.toLowerCase().includes(q) ||
                        n.description.toLowerCase().includes(q) ||
                        n.keyFields.some((f) => f.toLowerCase().includes(q))
                    );
                })
                .map((n) => n.id),
        );
    }, [activeClusters, search, modelNodes]);

    const nodes: Node[] = useMemo(
        () =>
            modelNodes
                .filter((n) => visibleIds.has(n.id))
                .map((n) => ({
                    id: n.id,
                    type: "model",
                    position: n.position,
                    data: {
                        label: n.label,
                        cluster: n.cluster,
                        module: n.module,
                    },
                    selected: n.id === selectedId,
                })),
        [modelNodes, visibleIds, selectedId],
    );

    const edges: Edge[] = useMemo(
        () =>
            modelEdges
                .filter((e) => visibleIds.has(e.source) && visibleIds.has(e.target))
                .map((e) => ({
                    id: e.id,
                    source: e.source,
                    target: e.target,
                    label: e.label,
                    animated: Boolean(e.bridge) || e.source === selectedId || e.target === selectedId,
                    style: {
                        stroke: e.bridge
                            ? CLUSTER_META.escrow.color
                            : selectedId && (e.source === selectedId || e.target === selectedId)
                              ? "var(--foreground)"
                              : "var(--muted-foreground)",
                        strokeWidth:
                            e.bridge || e.source === selectedId || e.target === selectedId ? 2 : 1,
                    },
                    labelStyle: {fontSize: 10, fill: "var(--muted-foreground)"},
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 14,
                        height: 14,
                        color: e.bridge ? CLUSTER_META.escrow.color : "var(--muted-foreground)",
                    },
                })),
        [modelEdges, visibleIds, selectedId],
    );

    const selectedModel = selectedId ? (modelById.get(selectedId) ?? null) : null;

    const onNodeClick: NodeMouseHandler = useCallback(
        (_event, node) => {
            setSelectedId(node.id);
            onSelectModel?.(modelById.get(node.id) ?? null);
        },
        [onSelectModel, modelById],
    );

    const onPaneClick = useCallback(() => {
        setSelectedId(null);
        onSelectModel?.(null);
    }, [onSelectModel]);

    return (
        <div className="flex h-full min-h-[560px] rounded-md border overflow-hidden bg-muted">
            <div className="flex flex-1 flex-col min-w-0">
                <div className="flex flex-wrap items-center gap-2 border-b bg-background px-3 py-2">
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter models…"
                        className="h-8 w-48 rounded-md border bg-background px-2 text-sm"
                    />
                    <div className="flex flex-wrap gap-1.5">
                        {clusters.map((cluster) => {
                            const meta = CLUSTER_META[cluster];
                            const on = activeClusters.has(cluster);
                            return (
                                <button
                                    key={cluster}
                                    type="button"
                                    onClick={() => toggleCluster(cluster)}
                                    className="rounded-md border px-2 py-1 text-[11px] font-medium transition-opacity"
                                    style={{
                                        background: on ? meta.bg : "transparent",
                                        borderColor: meta.border,
                                        color: meta.color,
                                        opacity: on ? 1 : 0.4,
                                    }}
                                >
                                    {meta.label}
                                </button>
                            );
                        })}
                    </div>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                        {nodes.length} models · {edges.length} links · pan / zoom / click
                    </span>
                </div>

                <div className="flex-1 min-h-0">
                    <ReactFlow
                        key={`clusters-${[...activeClusters].sort().join("-")}`}
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        fitView
                        fitViewOptions={{padding: 0.15}}
                        minZoom={0.25}
                        maxZoom={1.5}
                        nodesDraggable={false}
                        proOptions={{hideAttribution: true}}
                    >
                        <Background gap={18} size={1} color="var(--border)" />
                        <Controls showInteractive={false} />
                        <MiniMap
                            nodeColor={(n) => {
                                const cluster = (n.data as {cluster?: SystemMapCluster})?.cluster;
                                return cluster ? CLUSTER_META[cluster].color : "var(--muted-foreground)";
                            }}
                            maskColor="rgba(15,23,42,0.08)"
                            className="!bg-card !border"
                        />
                    </ReactFlow>
                </div>
            </div>

            <NodeDetailPanel
                node={selectedModel}
                onClose={() => {
                    setSelectedId(null);
                    onSelectModel?.(null);
                }}
            />
        </div>
    );
}
