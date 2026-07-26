import {useCallback, useEffect, useMemo, useState} from "react";
import {
    Background,
    Controls,
    MarkerType,
    ReactFlow,
    type Edge,
    type Node,
    type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type {SystemMapFlow} from "./systemMap.types.ts";
import {FlowStepNode} from "./nodes.tsx";

const nodeTypes = {flowStep: FlowStepNode};

const FLOW_ACCENTS: Record<string, string> = {
    "catalog-checkout": "#b45309",
    "marketplace-listing": "#047857",
    "marketplace-bid": "#0f766e",
    "pm-sales": "#b45309",
    "pm-lease": "#0f766e",
    "pm-delivery": "#7c3aed",
};

type FlowDiagramProps = {
    flows: SystemMapFlow[];
};

export function FlowDiagram({flows}: FlowDiagramProps) {
    const [activeFlowId, setActiveFlowId] = useState(flows[0]?.id ?? "");
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

    useEffect(() => {
        setActiveFlowId(flows[0]?.id ?? "");
        setSelectedStepId(null);
    }, [flows]);

    const flow = flows.find((f) => f.id === activeFlowId) ?? flows[0] ?? null;
    const accent = flow ? (FLOW_ACCENTS[flow.id] ?? "#475569") : "#475569";

    const nodes: Node[] = useMemo(
        () =>
            (flow?.steps ?? []).map((step) => ({
                id: step.id,
                type: "flowStep",
                position: step.position,
                data: {
                    label: step.label,
                    description: step.description,
                    accent,
                },
                selected: step.id === selectedStepId,
            })),
        [flow, accent, selectedStepId],
    );

    const edges: Edge[] = useMemo(
        () =>
            (flow?.edges ?? []).map((e) => ({
                id: e.id,
                source: e.source,
                target: e.target,
                label: e.label,
                animated: true,
                style: {stroke: accent, strokeWidth: 2},
                labelStyle: {fontSize: 10, fill: "#64748b"},
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 16,
                    height: 16,
                    color: accent,
                },
            })),
        [flow, accent],
    );

    const selectedStep = flow?.steps.find((s) => s.id === selectedStepId) ?? null;

    const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
        setSelectedStepId(node.id);
    }, []);

    if (!flow) {
        return <p className="text-sm text-muted-foreground">No flows defined.</p>;
    }

    return (
        <div className="flex flex-col gap-3 h-full min-h-[560px]">
            {flows.length > 1 && (
                <div className="flex flex-wrap gap-2">
                    {flows.map((f) => {
                        const on = f.id === flow.id;
                        const color = FLOW_ACCENTS[f.id] ?? "#475569";
                        return (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => {
                                    setActiveFlowId(f.id);
                                    setSelectedStepId(null);
                                }}
                                className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
                                style={{
                                    background: on ? `${color}14` : "transparent",
                                    borderColor: on ? color : "#e2e8f0",
                                    color: on ? color : "#64748b",
                                }}
                            >
                                {f.title}
                            </button>
                        );
                    })}
                </div>
            )}

            <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">{flow.summary}</p>

            <div className="flex flex-1 min-h-[420px] rounded-md border overflow-hidden bg-slate-50">
                <div className="flex-1 min-w-0">
                    <ReactFlow
                        key={flow.id}
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        onNodeClick={onNodeClick}
                        onPaneClick={() => setSelectedStepId(null)}
                        fitView
                        fitViewOptions={{padding: 0.2}}
                        minZoom={0.4}
                        maxZoom={1.4}
                        nodesDraggable={false}
                        proOptions={{hideAttribution: true}}
                    >
                        <Background gap={18} size={1} color="#e2e8f0" />
                        <Controls showInteractive={false} />
                    </ReactFlow>
                </div>

                <aside className="w-72 shrink-0 border-l bg-background p-4 text-sm overflow-y-auto">
                    {selectedStep ? (
                        <>
                            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                Step
                            </div>
                            <h3 className="text-base font-semibold mt-0.5">{selectedStep.label}</h3>
                            <p className="text-muted-foreground mt-2 leading-relaxed">
                                {selectedStep.description}
                            </p>
                            {selectedStep.detail && (
                                <p className="mt-3 text-[12px] leading-relaxed border-t pt-3 text-foreground">
                                    {selectedStep.detail}
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            <p className="font-medium">Flow steps</p>
                            <p className="text-muted-foreground mt-1">
                                Click a step to see what happens at that stage.
                            </p>
                            <ol className="mt-3 flex flex-col gap-1.5 list-decimal list-inside text-[12px]">
                                {flow.steps.map((s) => (
                                    <li key={s.id}>
                                        <button
                                            type="button"
                                            className="hover:underline text-left"
                                            onClick={() => setSelectedStepId(s.id)}
                                        >
                                            {s.label}
                                        </button>
                                    </li>
                                ))}
                            </ol>
                        </>
                    )}
                </aside>
            </div>
        </div>
    );
}
