import {useEffect, useRef} from "react";
import {useDispatch, useSelector} from "react-redux";
import apiClient from "@coreModule/helpers/apiClient/apiClient.ts";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {updatePreferredLanguage} from "@coreModule/helpers/redux/slices/authSlice.ts";
import {preferredLanguageToStore} from "@coreModule/helpers/general/preferredLanguage.ts";
import type {UpdateUserProfileLanguageFormType} from "armonia/src/modules/core/api/user/private/data/updateUserProfileLanguage.form.type.ts";

/**
 * Keeps the signed-in user's preferred language (the language of their SMS, WhatsApp and Telegram notices, D128) in
 * step with the panel language: stored on sign-in while unset, and again whenever the user switches the panel language.
 * A failed save is retried on the next switch; the panel works the same either way.
 *
 * @param active - true once the session is validated (the user's stored language is known)
 */
export function usePreferredLanguageSync(active: boolean): void {
    const dispatch = useDispatch();
    const userId = useSelector((state: RootState) => state.authentication.user.id);
    const stored = useSelector((state: RootState) => state.authentication.user.preferredLanguage);
    const current = useSelector((state: RootState) => state.language.languageCode);
    const seen = useRef<{userId: string; language: string} | null>(null);

    useEffect(() => {
        if (!active || !userId) {
            seen.current = null;
            return;
        }
        const previous = seen.current?.userId === userId ? seen.current.language : null;
        seen.current = {userId, language: current};
        const preferredLanguage = preferredLanguageToStore({previous, current, stored});
        if (!preferredLanguage) return;
        const body: UpdateUserProfileLanguageFormType = {preferredLanguage};
        apiClient
            .patch("/api/user/data/language", body)
            .then(() => dispatch(updatePreferredLanguage(preferredLanguage)))
            .catch(() => undefined);
    }, [active, userId, current, stored, dispatch]);
}
