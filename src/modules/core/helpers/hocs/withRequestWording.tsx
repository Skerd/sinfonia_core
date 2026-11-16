import {useMemo, type ComponentType} from "react";
import type {ResolveLanguageKey, ResolveLanguageKeyImpl} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {useActionAccess} from "@coreModule/helpers/hooks/useActionAccess.ts";

/**
 * Words a create page as a request on a requestable platform list (D160): when the session's company may not create on
 * `accessKey` but holds its `request` permission, every key resolves from the dictionary's `request` block first
 * (`request.title`, `request.formHeader.*`, `request.formButtons.submit`, `request.axios.*`, …) and falls back to the
 * create wording when the block lacks it. Anywhere else the page keeps its own wording.
 *
 * Compose it right after `withLanguage` and before `withAxios`, so the request toasts are worded too.
 *
 * @example
 * compose(withLanguage(path), withRequestWording("countries"), withAxios({url, method: "PUT", data: {}}, true))(Page)
 */
function withRequestWording(accessKey: string) {
    return <P extends {resolveLanguageKey: ResolveLanguageKey}>(Inner: ComponentType<P>) => {
        function RequestWording(props: P) {
            const {create, requestable} = useAccess(accessKey);
            const canRequest = useActionAccess(accessKey, "request");
            const requesting = !!requestable && !create && canRequest;
            const base = props.resolveLanguageKey;
            const resolveLanguageKey = useMemo<ResolveLanguageKey>(() => {
                if (!requesting) return base;
                const resolve: ResolveLanguageKeyImpl = (key, returnUndefinedIfNeeded) => {
                    const requestWording = base(`request.${key}`, true);
                    return requestWording !== null && requestWording !== "" ? requestWording : base(key, returnUndefinedIfNeeded);
                };
                return resolve;
            }, [requesting, base]);
            return <Inner {...props} resolveLanguageKey={resolveLanguageKey} />;
        }
        RequestWording.displayName = `withRequestWording(${Inner.displayName ?? Inner.name ?? "Component"})`;
        return RequestWording;
    };
}

export default withRequestWording;
