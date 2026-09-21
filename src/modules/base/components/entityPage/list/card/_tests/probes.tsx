/**
 * Prop-recording probes and the fake `withLanguage`, with **no application imports**.
 *
 * This is deliberately separate from `harness.tsx`: `vi.mock` factories import these, and
 * `harness.tsx` reaches `accessContext.tsx → sessionSetupScreen.tsx → withLanguage.tsx`. A
 * factory mocking `withLanguage` that awaited the harness would wait on a module that is
 * itself waiting on that factory, and the test file would hang before running anything.
 *
 * Keep this file dependency-free apart from React.
 */
import type {ComponentType, ReactNode} from "react";

export type ProbeCall = {token: string; props: Record<string, any>};

export const calls: ProbeCall[] = [];

export function resetCalls(): void {
    calls.length = 0;
}

/** Records every render's props and renders its children, so subtrees stay reachable. */
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

export function renderCount(token: string): number {
    return propsOf(token).length;
}

/** Deterministic translator: keys come back prefixed so tests can tell resolved from raw. */
export const t = (key: string) => `t:${key}`;

export function fakeWithLanguage(_path: string) {
    return (Wrapped: ComponentType<any>) => {
        function WithFakeLanguage(props: Record<string, any>) {
            return <Wrapped resolveLanguageKey={t} {...props} />;
        }
        return WithFakeLanguage;
    };
}
