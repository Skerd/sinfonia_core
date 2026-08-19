export type SystemMapCluster =
    | "catalog"
    | "ordering"
    | "payments"
    | "marketplace"
    | "escrow"
    | "portfolio"
    | "sales"
    | "leasing"
    | "delivery"
    | "cost"
    | "quality"
    | "shared";

export type SystemMapModule =
    | "eCommerce"
    | "eCommerceMarketplace"
    | "propertyManagement"
    | "shared";

export type SystemMapModelNode = {
    id: string;
    label: string;
    cluster: SystemMapCluster;
    module: SystemMapModule;
    description: string;
    keyFields: string[];
    apiPath?: string;
    panelRoute?: string;
    actions?: string[];
    position: {x: number; y: number};
};

export type SystemMapEdge = {
    id: string;
    source: string;
    target: string;
    label?: string;
    /** Cross-module bridge edges are rendered distinctly */
    bridge?: boolean;
};

export type FlowStep = {
    id: string;
    label: string;
    description: string;
    detail?: string;
    position: {x: number; y: number};
};

export type FlowEdge = {
    id: string;
    source: string;
    target: string;
    label?: string;
    /** Reverse path (reject / reopen / reissue / supersede). Rendered dashed, below the happy path. */
    backtrack?: boolean;
};

export type SystemMapFlow = {
    id: string;
    title: string;
    summary: string;
    module: SystemMapModule;
    steps: FlowStep[];
    edges: FlowEdge[];
};

export type CapabilityItem = {
    title: string;
    description: string;
};

export type ModuleCapabilities = {
    id: SystemMapModule;
    title: string;
    summary: string;
    offers: CapabilityItem[];
    apis: string[];
    crons?: string[];
    publicRoutes?: string[];
};

export type SystemMapDataset = {
    nodes: SystemMapModelNode[];
    edges: SystemMapEdge[];
    flows: SystemMapFlow[];
    capabilities: ModuleCapabilities[];
    clusters: SystemMapCluster[];
};
