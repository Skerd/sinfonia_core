import {useEffect, useMemo, useRef, useState} from "react";
import {useSelector} from "react-redux";
import {toast} from "sonner";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {Switch} from "@coreModule/components/ui/switch.tsx";
import {getNotificationTypeGroups} from "@coreModule/helpers/moduleContributions/loadNotificationTypesContributions.ts";
import type {NotificationPreferencesFormResponseType} from "armonia/src/modules/core/api/user/private/notifications/notificationPreferences.form.response.type.ts";
import type {NotificationPreferenceFormType} from "armonia/src/modules/core/api/user/private/notifications/notificationPreference.form.type.ts";

const API = "/api/user/notifications/preferences";

type NotificationTypePreferencesProps = WithLanguageType & {
    specificUserId?: string;
};

/**
 * One switch per notification type the company's modules declare (D117), grouped by module. A type switched off is
 * neither shown in-app nor emailed by the module; security notices are always sent and never listed. `specificUserId`
 * is sent as the `specificUser` header, the way the other account-settings sections inspect another user.
 */
function NotificationTypePreferences({resolveLanguageKey, specificUserId}: NotificationTypePreferencesProps) {
    const languageCode = useSelector((state: RootState) => state.language.languageCode);
    const groups = useMemo(() => getNotificationTypeGroups(languageCode), [languageCode]);

    const [muted, setMuted] = useState<Set<string> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const mutedRef = useRef(muted);
    mutedRef.current = muted;

    const readRequest = useMemo<HttpRequest>(
        () => ({method: "get", url: API, extraHeader: specificUserId ? {specificUser: specificUserId} : undefined}),
        [specificUserId],
    );
    const updateRequest = useMemo<HttpRequest>(
        () => ({method: "patch", url: API, extraHeader: specificUserId ? {specificUser: specificUserId} : undefined}),
        [specificUserId],
    );

    const [loadCount, setLoadCount] = useState(0);
    useEffect(() => {
        setLoadCount((count) => count + 1);
    }, [specificUserId]);
    useHttpRequest<NotificationPreferencesFormResponseType>(readRequest, {}, loadCount, true, {
        success: (data) => setMuted(new Set(data.mutedCodes)),
        // A failed reload after a failed save keeps the switches; only the first load shows the error.
        error: () => {
            if (!mutedRef.current) setError(resolveLanguageKey("loadFailed"));
        },
    });

    const [change, setChange] = useState<NotificationPreferenceFormType | null>(null);
    const [saveCount, setSaveCount] = useState(0);
    const {loading: busy} = useHttpRequest<NotificationPreferencesFormResponseType>(updateRequest, change ?? {}, saveCount, true, {
        success: (data) => {
            setMuted(new Set(data.mutedCodes));
            toast.success(resolveLanguageKey("saved"));
        },
        error: () => {
            // Roll the optimistic switch back to what the server has.
            setLoadCount((count) => count + 1);
            toast.error(resolveLanguageKey("saveFailed"));
        },
    });

    const toggle = (code: string, on: boolean) => {
        // Optimistic: a switch that visibly lags feels broken.
        setMuted((previous) => {
            const next = new Set(previous);
            if (on) next.delete(code);
            else next.add(code);
            return next;
        });
        setChange({code, muted: !on});
        setSaveCount((count) => count + 1);
    };

    if (groups.length === 0) return null;

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h3 className="text-base font-medium">{resolveLanguageKey("title")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{resolveLanguageKey("description")}</p>
            </div>
            {error ? (
                <p className="text-sm text-muted-foreground">{error}</p>
            ) : !muted ? (
                <p className="text-sm text-muted-foreground">{resolveLanguageKey("loading")}</p>
            ) : (
                groups.map((group) => (
                    <section key={group.id} className="flex flex-col gap-2" aria-label={group.title}>
                        <h4 className="text-sm font-medium text-muted-foreground">{group.title}</h4>
                        <div className="flex flex-col divide-y rounded-lg border">
                            {group.types.map((type) => (
                                <label key={type.code} className="flex items-center justify-between gap-4 px-4 py-3">
                                    <span className="text-sm">{type.title}</span>
                                    <Switch
                                        checked={!muted.has(type.code)}
                                        disabled={busy}
                                        onCheckedChange={(checked) => toggle(type.code, checked)}
                                        aria-label={type.title}
                                    />
                                </label>
                            ))}
                        </div>
                    </section>
                ))
            )}
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/accountSettings/notifications/notificationTypePreferences.tsx"),
)(NotificationTypePreferences);
