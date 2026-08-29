import {useId, useMemo, useState, type ReactNode} from "react";
import type {FieldBinding, ViewMode, ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import {Input} from "@coreModule/components/ui/input.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Separator} from "@coreModule/components/ui/separator.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@coreModule/components/ui/collapsible.tsx";
import {IconAlertTriangle, IconChevronRight, IconX} from "@tabler/icons-react";
import {
    getRegisteredWidgetTokens,
    getWidgetMeta,
} from "@coreModule/components/viewEngine/widgetRegistry.ts";
import {isCompoundFormWidget} from "@coreModule/components/viewEngine/renderFormWidget.tsx";
import WidgetPropsEditor from "./widgetPropsEditor.tsx";
import NodeBreadcrumb, {type Crumb} from "./nodeBreadcrumb.tsx";
import NodeSourceLink from "./nodeSourceLink.tsx";
import {csvToList, prune, Row, ToggleRow} from "./inspectorControls.tsx";
import {
    clearInspectorKey,
    deadConfigEntries,
    relevanceFor,
    type InspectorKey,
    type ViewShape,
} from "./fieldRelevance.ts";

type NodeInspectorProps = {
    node: ViewNode;
    mode: "sheet" | "form";
    /** Distinguishes `form:create` from `form:edit`; several controls only apply to edit. */
    viewMode?: ViewMode;
    /** Dotted paths from the access map, offered as `field.name` suggestions. */
    readPaths: string[];
    writePaths: string[];
    /** Ancestors of this node, outermost first. */
    breadcrumb?: Crumb[];
    onSelectCrumb?: (key: string) => void;
    /** `${model}:${viewKey}` and this node's path, for the source link. */
    sourceTarget?: string;
    nodePath?: string | null;
    /**
     * `coalesceKey` names the control being edited, so a run of keystrokes in one field
     * collapses into a single undo entry.
     */
    onChange: (next: ViewNode, coalesceKey?: string) => void;
};

/**
 * One control, paired with the contract key that decides whether it applies here.
 * Sections partition their slots by {@link relevanceFor}, so a control is never
 * rendered in a view type that ignores it.
 */
type Slot = {key: InspectorKey; render: () => ReactNode};

function Section({
    title,
    slots,
    shape,
    node,
    action,
    empty,
}: {
    title?: string;
    slots: Slot[];
    shape: ViewShape;
    node: ViewNode;
    /** Rendered in the section header (e.g. the field binding's Bind / Unbind button). */
    action?: ReactNode;
    /** Shown when the section has no applicable controls at all. */
    empty?: ReactNode;
}) {
    const [advancedOpen, setAdvancedOpen] = useState(false);

    const {primary, advanced} = useMemo(() => {
        const primaryList: Slot[] = [];
        const advancedList: Slot[] = [];
        for (const slot of slots) {
            const state = relevanceFor(slot.key, shape, node).state;
            if (state === "primary") primaryList.push(slot);
            else if (state === "advanced") advancedList.push(slot);
        }
        return {primary: primaryList, advanced: advancedList};
    }, [slots, shape, node]);

    if (primary.length === 0 && advanced.length === 0 && !empty && !action) return null;

    return (
        <div>
            {(title || action) && (
                <div className="mb-2 flex items-center justify-between">
                    {title && (
                        <p className="text-3xs uppercase tracking-wide text-muted-foreground">
                            {title}
                        </p>
                    )}
                    {action}
                </div>
            )}

            {primary.length === 0 && advanced.length === 0 ? (
                empty
            ) : (
                <div className="flex flex-col gap-3">
                    {primary.map((slot) => (
                        <div key={slot.key}>{slot.render()}</div>
                    ))}

                    {advanced.length > 0 && (
                        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                            <CollapsibleTrigger className="flex w-full items-center gap-1 text-3xs text-muted-foreground hover:text-foreground">
                                <IconChevronRight
                                    className={`size-3 transition-transform ${
                                        advancedOpen ? "rotate-90" : ""
                                    }`}
                                />
                                Advanced
                                <Badge variant="outline" className="ml-1 px-1 text-3xs tabular-nums">
                                    {advanced.length}
                                </Badge>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-3 flex flex-col gap-3 border-l pl-2">
                                {advanced.map((slot) => (
                                    <div key={slot.key}>{slot.render()}</div>
                                ))}
                            </CollapsibleContent>
                        </Collapsible>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * Keys this view type ignores that the node sets anyway.
 *
 * Hiding an inapplicable control is only safe while it holds nothing — a value the
 * inspector stops rendering is a value that still exports and can no longer be reached.
 * This strip is where those surface, with the reason and a way out.
 */
function DeadConfigStrip({
    node,
    shape,
    onChange,
}: {
    node: ViewNode;
    shape: ViewShape;
    onChange: (next: ViewNode) => void;
}) {
    const entries = useMemo(() => deadConfigEntries(node, shape), [node, shape]);
    if (entries.length === 0) return null;

    return (
        <div className="rounded border border-warning/40 bg-warning/10 p-2">
            <p className="mb-1.5 flex items-center gap-1 text-3xs font-medium uppercase tracking-wide text-warning">
                <IconAlertTriangle className="size-3 shrink-0" />
                Dead config
            </p>
            <div className="flex flex-col gap-2">
                {entries.map((entry) => (
                    <div key={entry.key} className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                            <p className="font-mono text-3xs">
                                {entry.key}
                                <span className="text-muted-foreground">
                                    {" = "}
                                    {JSON.stringify(entry.value)}
                                </span>
                            </p>
                            <p className="text-3xs text-muted-foreground">{entry.reason}</p>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove ${entry.key}`}
                            className="size-6 shrink-0"
                            onClick={() => onChange(clearInspectorKey(node, entry.key))}
                        >
                            <IconX className="size-3.5" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function NodeInspector({
    node,
    mode,
    viewMode,
    readPaths,
    writePaths,
    breadcrumb,
    onSelectCrumb,
    sourceTarget,
    nodePath = null,
    onChange,
}: NodeInspectorProps) {
    const widgetListId = useId();
    const pathListId = useId();

    const widgetTokens = useMemo(() => getRegisteredWidgetTokens().sort(), []);
    /* Field names come from whichever allowlist governs this mode. */
    const pathOptions = mode === "form" ? writePaths : readPaths;

    const shape = useMemo<ViewShape>(() => ({viewType: mode, viewMode}), [mode, viewMode]);

    const setField = (patch: Partial<FieldBinding>, coalesceKey?: string) => {
        if (!node.field) return;
        onChange({...node, field: prune({...node.field, ...patch})}, coalesceKey);
    };

    const setPermissions = (
        patch: Partial<NonNullable<ViewNode["permissions"]>>,
        coalesceKey?: string,
    ) => {
        const merged = prune({...(node.permissions ?? {}), ...patch});
        onChange(
            {...node, permissions: Object.keys(merged).length > 0 ? merged : undefined},
            coalesceKey,
        );
    };

    /* `props` are described by the rendered token, `widgetProps` by the bound widget. */
    const renderMeta = getWidgetMeta(node.render);
    const widgetMeta = node.field ? getWidgetMeta(node.field.widget) : undefined;

    const visibilitySlots: Slot[] = [
        {
            key: "dependent",
            render: () => (
                <Row label="dependent" hint="Hide the subtree when this path has no value.">
                    <Input
                        value={node.dependent ?? ""}
                        list={pathListId}
                        className="h-8 font-mono text-2xs"
                        onChange={(e) => onChange({...node, dependent: e.target.value || undefined}, "dependent")}
                    />
                </Row>
            ),
        },
        {
            key: "dependentAny",
            render: () => (
                <Row label="dependentAny" hint="Comma-separated. Shows when any path has a value.">
                    <Input
                        value={node.dependentAny?.join(", ") ?? ""}
                        className="h-8 font-mono text-2xs"
                        onChange={(e) => onChange({...node, dependentAny: csvToList(e.target.value)}, "dependentAny")}
                    />
                </Row>
            ),
        },
        {
            key: "dependentRuntimeOnly",
            render: () => (
                <ToggleRow
                    label="dependentRuntimeOnly"
                    hint="Skip the server-side prune; evaluate against entity data only."
                    checked={!!node.dependentRuntimeOnly}
                    onCheckedChange={(value) =>
                        onChange({...node, dependentRuntimeOnly: value || undefined})
                    }
                />
            ),
        },
    ];

    const permissionSlots: Slot[] = [
        {
            key: "permissions.read",
            render: () => (
                <Row
                    label="read"
                    hint={
                        mode === "form"
                            ? "Server-side prune only — forms do not gate on read access client-side."
                            : undefined
                    }
                >
                    <Input
                        value={node.permissions?.read ?? ""}
                        list={pathListId}
                        className="h-8 font-mono text-2xs"
                        onChange={(e) => setPermissions({read: e.target.value || undefined}, "permissions.read")}
                    />
                </Row>
            ),
        },
        {
            key: "permissions.readAny",
            render: () => (
                <Row label="readAny" hint="Comma-separated; any one grants access.">
                    <Input
                        value={node.permissions?.readAny?.join(", ") ?? ""}
                        className="h-8 font-mono text-2xs"
                        onChange={(e) => setPermissions({readAny: csvToList(e.target.value)}, "permissions.readAny")}
                    />
                </Row>
            ),
        },
        {
            key: "permissions.write",
            render: () => (
                <Row label="write">
                    <Input
                        value={node.permissions?.write ?? ""}
                        list={pathListId}
                        className="h-8 font-mono text-2xs"
                        onChange={(e) => setPermissions({write: e.target.value || undefined}, "permissions.write")}
                    />
                </Row>
            ),
        },
        {
            key: "permissions.writeAny",
            render: () => (
                <Row label="writeAny" hint="Comma-separated; any one grants access.">
                    <Input
                        value={node.permissions?.writeAny?.join(", ") ?? ""}
                        className="h-8 font-mono text-2xs"
                        onChange={(e) => setPermissions({writeAny: csvToList(e.target.value)}, "permissions.writeAny")}
                    />
                </Row>
            ),
        },
    ];

    const fieldSlots: Slot[] = node.field
        ? [
              {
                  key: "field.name",
                  render: () => (
                      <Row
                          label="name"
                          hint={
                              mode === "form"
                                  ? "react-hook-form path. Suggestions come from the write allowlist."
                                  : "Data path on the entity. Suggestions come from the read allowlist."
                          }
                      >
                          <Input
                              value={node.field!.name}
                              list={pathListId}
                              className="h-8 font-mono text-2xs"
                              onChange={(e) => setField({name: e.target.value}, "field.name")}
                          />
                      </Row>
                  ),
              },
              {
                  key: "field.widget",
                  render: () => (
                      <>
                          <Row label="widget">
                              <Input
                                  value={node.field!.widget}
                                  list={widgetListId}
                                  className="h-8 font-mono text-2xs"
                                  onChange={(e) => setField({widget: e.target.value}, "field.widget")}
                              />
                          </Row>
                          {mode === "form" && isCompoundFormWidget(node.field!.widget) && (
                              <p className="mt-3 flex items-start gap-1 rounded border border-warning/40 bg-warning/10 p-1.5 text-3xs">
                                  <IconAlertTriangle className="mt-px size-3 shrink-0 text-warning" />
                                  <span>
                                      Compound widget — it owns its own <code>FormField</code>.
                                      Label and placeholder are handled inside the widget.
                                  </span>
                              </p>
                          )}
                      </>
                  ),
              },
              {
                  key: "field.label",
                  render: () => (
                      <Row label="label" hint="Language key, resolved by resolveLanguageKey.">
                          <Input
                              value={node.field!.label ?? ""}
                              className="h-8 font-mono text-2xs"
                              onChange={(e) => setField({label: e.target.value || undefined}, "field.label")}
                          />
                      </Row>
                  ),
              },
              {
                  key: "field.placeholder",
                  render: () => (
                      <Row label="placeholder" hint="Language key.">
                          <Input
                              value={node.field!.placeholder ?? ""}
                              className="h-8 font-mono text-2xs"
                              onChange={(e) => setField({placeholder: e.target.value || undefined}, "field.placeholder")}
                          />
                      </Row>
                  ),
              },
              {
                  key: "field.required",
                  render: () => (
                      <ToggleRow
                          label="required"
                          checked={!!node.field!.required}
                          onCheckedChange={(value) => setField({required: value || undefined})}
                      />
                  ),
              },
              {
                  key: "field.disabled",
                  render: () => (
                      <ToggleRow
                          label="disabled"
                          checked={!!node.field!.disabled}
                          onCheckedChange={(value) => setField({disabled: value || undefined})}
                      />
                  ),
              },
              {
                  key: "field.skipWriteAccessGate",
                  render: () => (
                      <ToggleRow
                          label="skipWriteAccessGate"
                          hint="Keep a UI-only field that is not a real write key."
                          checked={!!node.field!.skipWriteAccessGate}
                          onCheckedChange={(value) =>
                              setField({skipWriteAccessGate: value || undefined})
                          }
                      />
                  ),
              },
              {
                  key: "field.skipReadAccessGate",
                  render: () => (
                      <ToggleRow
                          label="skipReadAccessGate"
                          hint="Do not blur computed or virtual paths."
                          checked={!!node.field!.skipReadAccessGate}
                          onCheckedChange={(value) =>
                              setField({skipReadAccessGate: value || undefined})
                          }
                      />
                  ),
              },
              {
                  key: "field.renderWhenWriteAny",
                  render: () => (
                      <Row label="renderWhenWriteAny" hint="Comma-separated write keys.">
                          <Input
                              value={node.field!.renderWhenWriteAny?.join(", ") ?? ""}
                              className="h-8 font-mono text-2xs"
                              onChange={(e) =>
                                  setField({renderWhenWriteAny: csvToList(e.target.value)}, "field.renderWhenWriteAny")
                              }
                          />
                      </Row>
                  ),
              },
              {
                  key: "field.widgetProps",
                  render: () => (
                      <WidgetPropsEditor
                          label="widgetProps"
                          value={node.field!.widgetProps}
                          onChange={(widgetProps) => setField({widgetProps}, "field.widgetProps")}
                          propMeta={widgetMeta?.widgetProps}
                          pathListId={pathListId}
                          widgetListId={widgetListId}
                          description={
                              widgetMeta?.widgetProps
                                  ? undefined
                                  : "Widget-specific options (apiUrl, icon, maxLength, …)."
                          }
                      />
                  ),
              },
          ]
        : [];

    return (
        <div className="flex flex-col gap-4 p-3">
            <div>
                <p className="text-3xs uppercase tracking-wide text-muted-foreground">Node</p>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                    <Badge variant="outline" className="font-mono text-3xs">
                        {node.render}
                    </Badge>
                    {node.field && (
                        <Badge variant="secondary" className="font-mono text-3xs">
                            {node.field.widget}
                        </Badge>
                    )}
                    <Badge variant="outline" className="text-3xs">
                        {viewMode ? `${mode}:${viewMode}` : mode}
                    </Badge>
                </div>
                {breadcrumb && onSelectCrumb && (
                    <div className="mt-1.5">
                        <NodeBreadcrumb crumbs={breadcrumb} onSelect={onSelectCrumb} />
                    </div>
                )}
                <NodeSourceLink target={sourceTarget} nodePath={nodePath} />
                {(widgetMeta?.docs || renderMeta?.docs) && (
                    <p className="mt-1 text-3xs text-muted-foreground">
                        {widgetMeta?.docs ?? renderMeta?.docs}
                    </p>
                )}
            </div>

            <DeadConfigStrip node={node} shape={shape} onChange={onChange} />

            <Row
                label="render"
                hint={
                    node.field
                        ? '`#Field` is a pseudo-token: a bound node is matched by `field`, before `render` is resolved.'
                        : "A `#Token` from the registry, or a plain HTML tag."
                }
            >
                <Input
                    value={node.render}
                    className="h-8 font-mono text-2xs"
                    onChange={(e) => onChange({...node, render: e.target.value}, "render")}
                />
            </Row>

            <WidgetPropsEditor
                label="props"
                value={node.props}
                onChange={(props) => onChange({...node, props}, "props")}
                propMeta={renderMeta?.props}
                pathListId={pathListId}
                widgetListId={widgetListId}
                description={
                    renderMeta?.props ? undefined : "Forwarded to the resolved component."
                }
            />

            <Separator />

            <Section title="Visibility" slots={visibilitySlots} shape={shape} node={node} />

            <Separator />

            <Section title="Permissions" slots={permissionSlots} shape={shape} node={node} />

            <Separator />

            <Section
                title="Field binding"
                slots={fieldSlots}
                shape={shape}
                node={node}
                action={
                    node.field ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-3xs"
                            onClick={() => {
                                const {field: _field, ...rest} = node;
                                onChange(rest);
                            }}
                        >
                            Unbind
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 text-3xs"
                            onClick={() =>
                                onChange({
                                    ...node,
                                    field: {
                                        name: "",
                                        widget: node.render.startsWith("#") ? node.render : "#Input",
                                    },
                                })
                            }
                        >
                            Bind a field
                        </Button>
                    )
                }
                empty={
                    <p className="text-3xs text-muted-foreground">
                        Layout node — renders its children. Bind a field to make it a data node.
                    </p>
                }
            />

            {/* Native datalists: cheap autocomplete over the real allowlists and registry. */}
            <datalist id={widgetListId}>
                {widgetTokens.map((token) => (
                    <option key={token} value={token} />
                ))}
            </datalist>
            <datalist id={pathListId}>
                {pathOptions.map((path) => (
                    <option key={path} value={path} />
                ))}
            </datalist>
        </div>
    );
}
