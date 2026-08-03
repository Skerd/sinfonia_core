import {useMemo, useState} from "react";
import {RotateCcw, Search, ShieldQuestionMark} from "lucide-react";
import {Popover, PopoverContent, PopoverTrigger} from "@coreModule/components/ui/popover.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Switch} from "@coreModule/components/ui/switch.tsx";
import {Checkbox} from "@coreModule/components/ui/checkbox.tsx";
import {Input} from "@coreModule/components/ui/input.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {
    AccessDebugOverrides,
    AccessObject,
    AccessPermissionOverride,
    accessFieldPathExists,
    flattenAccessFieldPaths,
    useAccess,
    useAccessDebugOverrides,
    useAccessMap,
} from "@coreModule/helpers/hocs/withAccess.tsx";

const ACCESS_BOOL_KEYS: Array<keyof Pick<AccessPermissionOverride, "create" | "delete" | "restore">> = [
    "create",
    "delete",
    "restore",
];

function isAccessGranted(value: unknown): boolean {
    if (value === true) return true;
    if (value === false || value == null) return false;
    if (typeof value === "object") return Object.keys(value as object).length > 0;
    return Boolean(value);
}

function perspectiveHasOverrides(override?: AccessPermissionOverride): boolean {
    if (!override) return false;
    return (
        override.create !== undefined
        || override.delete !== undefined
        || override.restore !== undefined
        || override.read !== undefined
        || override.write !== undefined
        || Object.keys(override.readFields ?? {}).length > 0
        || Object.keys(override.writeFields ?? {}).length > 0
    );
}

function countPerspectiveOverrides(override?: AccessPermissionOverride): number {
    if (!override) return 0;
    let n = 0;
    for (const key of ACCESS_BOOL_KEYS) {
        if (override[key] !== undefined) n++;
    }
    if (override.read !== undefined) n++;
    if (override.write !== undefined) n++;
    n += Object.keys(override.readFields ?? {}).length;
    n += Object.keys(override.writeFields ?? {}).length;
    return n;
}

function updatePerspectiveOverride(
    prev: AccessDebugOverrides,
    resourceId: string,
    perspective: "self" | "others",
    mutate: (current: AccessPermissionOverride) => AccessPermissionOverride,
): AccessDebugOverrides {
    const resource = prev[resourceId] ?? {};
    const current = resource[perspective] ?? {};
    const nextPerspective = mutate({...current});
    const cleaned: AccessPermissionOverride = {...nextPerspective};
    if (cleaned.readFields && Object.keys(cleaned.readFields).length === 0) {
        delete cleaned.readFields;
    }
    if (cleaned.writeFields && Object.keys(cleaned.writeFields).length === 0) {
        delete cleaned.writeFields;
    }
    const nextResource = {...resource};
    if (!perspectiveHasOverrides(cleaned)) {
        delete nextResource[perspective];
    } else {
        nextResource[perspective] = cleaned;
    }
    const next = {...prev};
    if (Object.keys(nextResource).length === 0) {
        delete next[resourceId];
    } else {
        next[resourceId] = nextResource;
    }
    return next;
}

function DebugSegmentedControl<T extends string>({
    value,
    options,
    onChange,
}: {
    value: T;
    options: Array<{value: T; label: string; hint?: string}>;
    onChange: (value: T) => void;
}) {
    return (
        <div
            className="grid gap-0.5 rounded-md bg-muted p-0.5"
            style={{gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`}}
        >
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    className={cn(
                        "h-7 rounded-sm px-2 text-[11px] font-medium transition-colors",
                        value === opt.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => onChange(opt.value)}
                >
                    {opt.label}
                    {opt.hint ? (
                        <span className="ms-1 tabular-nums text-muted-foreground">{opt.hint}</span>
                    ) : null}
                </button>
            ))}
        </div>
    );
}

function AccessFieldMapPanel({
    resourceId,
    perspective,
    kind,
    baseMap,
    effectiveMap,
    masterOverride,
    fieldOverrides,
}: {
    resourceId: string;
    perspective: "self" | "others";
    kind: "read" | "write";
    baseMap: unknown;
    effectiveMap: unknown;
    masterOverride?: boolean;
    fieldOverrides?: Record<string, boolean>;
}) {
    const debugOverrides = useAccessDebugOverrides();
    const [filter, setFilter] = useState("");
    const fieldPaths = useMemo(() => flattenAccessFieldPaths(baseMap), [baseMap]);
    const masterEnabled = isAccessGranted(effectiveMap);
    const masterDenied = masterOverride === false;
    const fieldsKey = kind === "read" ? "readFields" : "writeFields";
    const overrideCount = (masterOverride !== undefined ? 1 : 0) + Object.keys(fieldOverrides ?? {}).length;

    const filteredPaths = useMemo(() => {
        const q = filter.trim().toLowerCase();
        if (!q) return fieldPaths;
        return fieldPaths.filter(({path}) => path.toLowerCase().includes(q));
    }, [fieldPaths, filter]);

    const setMaster = (enabled: boolean) => {
        if (!debugOverrides) return;
        debugOverrides.setOverrides((prev) =>
            updatePerspectiveOverride(prev, resourceId, perspective, (current) => {
                const next = {...current};
                if (enabled === isAccessGranted(baseMap)) {
                    delete next[kind];
                } else {
                    next[kind] = enabled;
                }
                return next;
            }),
        );
    };

    const setField = (path: string, enabled: boolean) => {
        if (!debugOverrides || masterDenied) return;
        debugOverrides.setOverrides((prev) =>
            updatePerspectiveOverride(prev, resourceId, perspective, (current) => {
                const next = {...current};
                delete next[kind];
                const fields = {...(next[fieldsKey] ?? {})};
                const baseHas = accessFieldPathExists(baseMap, path);
                if (enabled === baseHas) {
                    delete fields[path];
                } else {
                    fields[path] = enabled;
                }
                if (!enabled) {
                    for (const childPath of Object.keys(fields)) {
                        if (childPath !== path && childPath.startsWith(`${path}.`)) {
                            delete fields[childPath];
                        }
                    }
                } else {
                    const parts = path.split(".");
                    for (let i = 1; i < parts.length; i++) {
                        const ancestor = parts.slice(0, i).join(".");
                        if (fields[ancestor] === false) {
                            delete fields[ancestor];
                        }
                    }
                }
                if (Object.keys(fields).length === 0) {
                    delete next[fieldsKey];
                } else {
                    next[fieldsKey] = fields;
                }
                return next;
            }),
        );
    };

    const setAllFields = (enabled: boolean) => {
        if (!debugOverrides || masterDenied || fieldPaths.length === 0) return;
        debugOverrides.setOverrides((prev) =>
            updatePerspectiveOverride(prev, resourceId, perspective, (current) => {
                const next = {...current};
                delete next[kind];
                if (enabled) {
                    delete next[fieldsKey];
                    return next;
                }
                const fields: Record<string, boolean> = {};
                for (const {path} of fieldPaths) {
                    fields[path] = false;
                }
                next[fieldsKey] = fields;
                return next;
            }),
        );
    };

    const clearFieldOverrides = () => {
        if (!debugOverrides) return;
        debugOverrides.setOverrides((prev) =>
            updatePerspectiveOverride(prev, resourceId, perspective, (current) => {
                const next = {...current};
                delete next[kind];
                delete next[fieldsKey];
                return next;
            }),
        );
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex h-8 shrink-0 items-center justify-between gap-2 rounded-md border bg-muted/40 px-2">
                <div className="flex items-center gap-2">
                    <Switch
                        id={`access-debug-${resourceId}-${perspective}-${kind}-master`}
                        size="sm"
                        checked={masterEnabled}
                        disabled={!debugOverrides}
                        onCheckedChange={setMaster}
                    />
                    <label
                        htmlFor={`access-debug-${resourceId}-${perspective}-${kind}-master`}
                        className="cursor-pointer text-xs font-medium capitalize"
                    >
                        {kind} enabled
                    </label>
                </div>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                    {overrideCount > 0 ? `${overrideCount} changed` : "server"}
                </span>
            </div>

            <div className="flex h-8 shrink-0 items-center gap-1.5">
                <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground"/>
                    <Input
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Filter fields…"
                        className="h-8 pl-7 text-xs"
                    />
                </div>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0 px-2 text-[10px]"
                    disabled={!debugOverrides || masterDenied || fieldPaths.length === 0}
                    onClick={() => setAllFields(true)}
                >
                    All on
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0 px-2 text-[10px]"
                    disabled={!debugOverrides || masterDenied || fieldPaths.length === 0}
                    onClick={() => setAllFields(false)}
                >
                    All off
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 shrink-0 px-1.5 text-[10px]"
                    disabled={!debugOverrides || overrideCount === 0}
                    onClick={clearFieldOverrides}
                    title="Reset field overrides"
                >
                    <RotateCcw className="size-3"/>
                </Button>
            </div>

            <div
                className={cn(
                    "min-h-[220px] flex-1 overflow-y-auto rounded-md border",
                    masterDenied && "opacity-50",
                )}
            >
                {fieldPaths.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-3 text-center text-[11px] text-muted-foreground">
                        {isAccessGranted(baseMap)
                            ? "Boolean grant — no field map from server."
                            : "No fields on server for this map."}
                    </div>
                ) : filteredPaths.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-3 text-[11px] text-muted-foreground">
                        No fields match “{filter}”.
                    </div>
                ) : (
                    <ul className="divide-y">
                        {filteredPaths.map(({path, depth}) => {
                            const enabled = !masterDenied && accessFieldPathExists(effectiveMap, path);
                            const overridden = fieldOverrides?.[path] !== undefined;
                            const label = path.includes(".") ? path.split(".").pop()! : path;
                            return (
                                <li
                                    key={path}
                                    className="flex h-8 items-center gap-2 px-2 hover:bg-muted/50"
                                >
                                    <Checkbox
                                        id={`access-debug-${resourceId}-${perspective}-${kind}-${path}`}
                                        checked={enabled}
                                        disabled={!debugOverrides || masterDenied}
                                        onCheckedChange={(checked) => setField(path, checked === true)}
                                        className="size-3.5"
                                    />
                                    <label
                                        htmlFor={`access-debug-${resourceId}-${perspective}-${kind}-${path}`}
                                        className={cn(
                                            "min-w-0 flex-1 cursor-pointer truncate font-mono text-[11px] leading-none",
                                            overridden && "text-amber-700 dark:text-amber-400",
                                        )}
                                        style={{paddingLeft: depth * 12}}
                                        title={path}
                                    >
                                        {label}
                                    </label>
                                    <span
                                        className={cn(
                                            "size-1.5 shrink-0 rounded-full",
                                            overridden ? "bg-amber-500" : "bg-transparent",
                                        )}
                                        aria-hidden
                                    />
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

function AccessPerspectivePanel({
    resourceId,
    perspective,
    base,
    effective,
}: {
    resourceId: string;
    perspective: "self" | "others";
    base: AccessObject;
    effective: AccessObject;
}) {
    const debugOverrides = useAccessDebugOverrides();
    const override = debugOverrides?.overrides[resourceId]?.[perspective];
    const [mapKind, setMapKind] = useState<"read" | "write">("read");

    const setBoolFlag = (key: typeof ACCESS_BOOL_KEYS[number], enabled: boolean) => {
        if (!debugOverrides) return;
        debugOverrides.setOverrides((prev) =>
            updatePerspectiveOverride(prev, resourceId, perspective, (current) => {
                const next = {...current};
                if (enabled === isAccessGranted(base[key])) {
                    delete next[key];
                } else {
                    next[key] = enabled;
                }
                return next;
            }),
        );
    };

    const readCount = flattenAccessFieldPaths(base.read).length;
    const writeCount = flattenAccessFieldPaths(base.write).length;

    return (
        <div className="flex h-full min-h-0 flex-col gap-2">
            <div className="grid shrink-0 grid-cols-3 gap-1.5">
                {ACCESS_BOOL_KEYS.map((key) => {
                    const enabled = isAccessGranted(effective[key]);
                    const overridden = override?.[key] !== undefined;
                    return (
                        <label
                            key={key}
                            htmlFor={`access-debug-${resourceId}-${perspective}-${key}`}
                            className={cn(
                                "flex h-9 cursor-pointer items-center justify-between gap-2 rounded-md border px-2 text-xs capitalize",
                                overridden && "border-amber-500/50 bg-amber-500/5",
                            )}
                        >
                            <span className="truncate">{key}</span>
                            <Checkbox
                                id={`access-debug-${resourceId}-${perspective}-${key}`}
                                checked={enabled}
                                disabled={!debugOverrides}
                                onCheckedChange={(checked) => setBoolFlag(key, checked === true)}
                                className="size-3.5"
                            />
                        </label>
                    );
                })}
            </div>

            <DebugSegmentedControl
                value={mapKind}
                //@ts-ignore
                onChange={setMapKind}
                options={[
                    {value: "read", label: "Read", hint: String(readCount)},
                    {value: "write", label: "Write", hint: String(writeCount)},
                ]}
            />

            <div className="flex min-h-0 flex-1 flex-col">
                {mapKind === "read" ? (
                    <AccessFieldMapPanel
                        resourceId={resourceId}
                        perspective={perspective}
                        kind="read"
                        baseMap={base.read}
                        effectiveMap={effective.read}
                        masterOverride={override?.read}
                        fieldOverrides={override?.readFields}
                    />
                ) : (
                    <AccessFieldMapPanel
                        resourceId={resourceId}
                        perspective={perspective}
                        kind="write"
                        baseMap={base.write}
                        effectiveMap={effective.write}
                        masterOverride={override?.write}
                        fieldOverrides={override?.writeFields}
                    />
                )}
            </div>
        </div>
    );
}

function AccessResourceDebugPanel({resourceId}: {resourceId: string}) {
    const accessMap = useAccessMap();
    const entry = accessMap[resourceId];
    const effectiveSelf = useAccess(resourceId, "self");
    const effectiveOthers = useAccess(resourceId, "others");
    const [perspective, setPerspective] = useState<"self" | "others">("self");

    if (!entry) {
        return (
            <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
                No access entry for <span className="font-semibold">{resourceId}</span>
            </div>
        );
    }

    const hasOthers = !!entry.others;
    const activePerspective = hasOthers ? perspective : "self";

    return (
        <div className="flex h-full min-h-0 flex-col gap-2">
            {hasOthers && (
                <DebugSegmentedControl
                    value={activePerspective}
                    //@ts-ignore
                    onChange={setPerspective}
                    options={[
                        {value: "self", label: "Self"},
                        {value: "others", label: "Others"},
                    ]}
                />
            )}
            <div className="min-h-0 flex-1">
                {activePerspective === "self" ? (
                    <AccessPerspectivePanel
                        resourceId={resourceId}
                        perspective="self"
                        base={entry.self}
                        effective={effectiveSelf}
                    />
                ) : entry.others ? (
                    <AccessPerspectivePanel
                        resourceId={resourceId}
                        perspective="others"
                        base={entry.others}
                        effective={effectiveOthers}
                    />
                ) : null}
            </div>
        </div>
    );
}

export function AccessDebugPopover({
    resourceIds,
    size,
}: {
    resourceIds: string[];
    size: number;
}) {
    const accessMap = useAccessMap();
    const debugOverrides = useAccessDebugOverrides();
    const [open, setOpen] = useState(false);
    const [activeResource, setActiveResource] = useState<string | null>(null);

    const overrideCount = useMemo(() => {
        if (!debugOverrides) return 0;
        return Object.values(debugOverrides.overrides).reduce((sum, resource) => {
            return sum + countPerspectiveOverrides(resource.self) + countPerspectiveOverrides(resource.others);
        }, 0);
    }, [debugOverrides]);

    const overriddenIds = useMemo(
        () => (debugOverrides ? Object.keys(debugOverrides.overrides).sort() : []),
        [debugOverrides],
    );

    const panelIds = resourceIds.length > 0 ? resourceIds : overriddenIds;
    const selectedId = activeResource && panelIds.includes(activeResource)
        ? activeResource
        : (panelIds[0] ?? null);

    const selectedOverrideCount = selectedId && debugOverrides
        ? countPerspectiveOverrides(debugOverrides.overrides[selectedId]?.self)
            + countPerspectiveOverrides(debugOverrides.overrides[selectedId]?.others)
        : 0;

    const clearAll = () => {
        debugOverrides?.setOverrides({});
    };

    const clearSelected = () => {
        if (!debugOverrides || !selectedId) return;
        debugOverrides.setOverrides((prev) => {
            if (!prev[selectedId]) return prev;
            const next = {...prev};
            delete next[selectedId];
            return next;
        });
    };

    return (
        <Popover open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        "inline-flex items-center justify-center rounded-sm p-0.5 hover:bg-background/80",
                        overrideCount > 0 && "text-amber-500",
                    )}
                    aria-label="Access debug overrides"
                    title="Access overrides"
                >
                    <ShieldQuestionMark size={size}/>
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                side="bottom"
                sideOffset={8}
                className="w-[380px] p-0"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div className="flex h-[520px] w-[380px] flex-col overflow-hidden">
                    <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold leading-none">Access overrides</p>
                            <p className="mt-1 truncate text-[10px] text-muted-foreground">
                                Localhost only · does not hit the server
                            </p>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 shrink-0 gap-1 px-2 text-[10px]"
                            disabled={!selectedId || !debugOverrides || selectedOverrideCount === 0}
                            onClick={clearSelected}
                        >
                            <RotateCcw className="size-3"/>
                            Reset
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 shrink-0 px-2 text-[10px]"
                            disabled={overrideCount === 0}
                            onClick={clearAll}
                        >
                            Clear all
                        </Button>
                    </div>

                    {!debugOverrides ? (
                        <div className="flex flex-1 items-center justify-center p-4 text-center text-[11px] text-destructive">
                            Mount under <code className="text-[10px]">withAccess</code> to edit permissions.
                        </div>
                    ) : panelIds.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center p-4 text-center text-[11px] text-muted-foreground">
                            Pass a resource id:
                            <br/>
                            <code className="mt-1 text-[10px]">withDebug(true, false, &quot;cities&quot;)</code>
                            {Object.keys(accessMap).length > 0 && (
                                <span className="mt-2 block text-muted-foreground">
                                    Loaded resources: {Object.keys(accessMap).length}
                                </span>
                            )}
                        </div>
                    ) : (
                        <>
                            {panelIds.length > 1 ? (
                                <div className="shrink-0 border-b px-3 py-2">
                                    <DebugSegmentedControl
                                        value={selectedId!}
                                        onChange={setActiveResource}
                                        options={panelIds.map((id) => ({value: id, label: id}))}
                                    />
                                </div>
                            ) : (
                                <div className="flex h-8 shrink-0 items-center border-b px-3">
                                    <span className="truncate font-mono text-[11px] text-muted-foreground">
                                        {selectedId}
                                    </span>
                                </div>
                            )}
                            <div className="flex min-h-0 flex-1 flex-col p-3">
                                {selectedId && <AccessResourceDebugPanel resourceId={selectedId}/>}
                            </div>
                            <div className="flex h-7 shrink-0 items-center border-t px-3 text-[10px] text-muted-foreground">
                                <span className="tabular-nums">{overrideCount}</span>
                                <span className="ms-1">active override{overrideCount === 1 ? "" : "s"}</span>
                            </div>
                        </>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
