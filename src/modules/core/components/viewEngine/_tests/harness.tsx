/**
 * Shared scaffolding for the viewEngine characterization tests.
 *
 * Each test file mocks the same four modules (vi.mock is hoisted per file, so the calls
 * live there) and pulls the stand-ins from here:
 *  - module widget contributions → none, so only core widgets are registered;
 *  - `withLanguage` → injects {@link t} instead of loading dictionaries through redux;
 *  - `withDebug` → identity;
 *  - `DisplayCard` → a {@link makeProbe} that records its props.
 *
 * Probes record every render, so assertions read the props a widget actually received.
 */
import type {ComponentType, ReactNode} from "react";
import {render} from "@testing-library/react";
import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";

export type ProbeCall = {token: string; props: Record<string, any>};

export const calls: ProbeCall[] = [];

export function resetCalls(): void {
    calls.length = 0;
}

export function makeProbe(token: string): ComponentType<any> {
    function Probe(props: Record<string, any>) {
        calls.push({token, props});
        return <div data-probe={token}>{props.children as ReactNode}</div>;
    }
    Probe.displayName = `Probe(${token})`;
    return Probe;
}

export function propsOf(token: string): Record<string, any>[] {
    return calls.filter((c) => c.token === token).map((c) => c.props);
}

export function lastProps(token: string): Record<string, any> {
    const all = propsOf(token);
    if (all.length === 0) throw new Error(`probe ${token} never rendered`);
    return all[all.length - 1]!;
}

/** Deterministic translator: keys come back prefixed so tests can tell resolved from raw. */
export const t = ((key: string, returnUndefined?: boolean) =>
    returnUndefined && key.startsWith("missing") ? null : `t:${key}`) as ResolveLanguageKey;

export function fakeWithLanguage(_path: string) {
    return (Wrapped: ComponentType<any>) => {
        function WithFakeLanguage(props: Record<string, any>) {
            return <Wrapped resolveLanguageKey={t} {...props} />;
        }
        return WithFakeLanguage;
    };
}

export function cardNode(
    name: string,
    widgetProps: Record<string, any> = {},
    extra: Partial<ViewNode> & {label?: string; fieldExtra?: Record<string, any>} = {},
): ViewNode {
    const {label = "label." + name, fieldExtra = {}, ...nodeExtra} = extra;
    return {
        render: "#DisplayCard",
        field: {name, widget: "#DisplayCard", label, widgetProps, ...fieldExtra},
        ...nodeExtra,
    } as ViewNode;
}

export function fieldNode(
    widget: string,
    name: string,
    widgetProps: Record<string, any> = {},
    extra: Partial<ViewNode> & {fieldExtra?: Record<string, any>} = {},
): ViewNode {
    const {fieldExtra = {}, ...nodeExtra} = extra;
    return {
        render: widget,
        field: {name, widget, widgetProps, ...fieldExtra},
        ...nodeExtra,
    } as ViewNode;
}

type SheetCtxOverrides = {
    data?: Record<string, any>;
    access?: Record<string, any>;
    [key: string]: unknown;
};

/**
 * Renders nodes in sheet mode through the real `ViewRenderer`. The renderer module is passed
 * in (dynamically imported after the mocks) rather than imported here.
 */
export function renderSheetWith(
    ViewRenderer: ComponentType<any>,
    nodes: ViewNode[],
    ctx: SheetCtxOverrides = {},
) {
    return render(
        <ViewRenderer
            nodes={nodes}
            ctx={{mode: "sheet", resolveLanguageKey: t, data: {}, ...ctx}}
        />,
    );
}

/** Mounts a card's `linkedReferenceSheet` the way `DisplayCard` does. */
export function renderLinkedSheet(
    sheet: {LinkedSheet: ComponentType<any>; linkedSheetProps?: Record<string, unknown>},
    outer: Record<string, unknown> = {},
) {
    const {LinkedSheet, linkedSheetProps} = sheet;
    return render(<LinkedSheet {...linkedSheetProps} {...outer} />);
}
