import {memo} from "react";
import {Handle, Position, type Node, type NodeProps} from "@xyflow/react";
import {CLUSTER_META} from "./clusterMeta.ts";
import type {SystemMapCluster, SystemMapModule} from "./systemMap.types.ts";

export type ModelNodeData = {
    label: string;
    cluster: SystemMapCluster;
    module: SystemMapModule;
};

export type ModelFlowNode = Node<ModelNodeData, "model">;

function ModelNodeComponent({data, selected}: NodeProps<ModelFlowNode>) {
    const meta = CLUSTER_META[data.cluster];
    return (
        <div
            className="rounded-md border px-3 py-2 shadow-sm min-w-[140px] max-w-[180px] transition-shadow"
            style={{
                background: meta.bg,
                borderColor: selected ? meta.color : meta.border,
                boxShadow: selected ? `0 0 0 2px ${meta.color}` : undefined,
            }}
        >
            <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />
            <div className="text-[10px] font-medium uppercase tracking-wide" style={{color: meta.color}}>
                {meta.label}
            </div>
            <div className="text-sm font-semibold text-slate-900 leading-tight mt-0.5">{data.label}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">{data.module}</div>
            <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2" />
        </div>
    );
}

export const ModelNode = memo(ModelNodeComponent);

export type FlowStepNodeData = {
    label: string;
    description: string;
    accent: string;
};

export type FlowStepFlowNode = Node<FlowStepNodeData, "flowStep">;

function FlowStepNodeComponent({data, selected}: NodeProps<FlowStepFlowNode>) {
    return (
        <div
            className="rounded-md border bg-white px-3 py-2 shadow-sm min-w-[150px] max-w-[180px]"
            style={{
                borderColor: selected ? data.accent : "#e2e8f0",
                boxShadow: selected ? `0 0 0 2px ${data.accent}` : undefined,
            }}
        >
            <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />
            <div className="text-sm font-semibold text-slate-900">{data.label}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">{data.description}</div>
            <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2" />
            <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-slate-400 !w-2 !h-2" />
            <Handle type="target" position={Position.Top} id="top" className="!bg-slate-400 !w-2 !h-2" />
        </div>
    );
}

export const FlowStepNode = memo(FlowStepNodeComponent);
