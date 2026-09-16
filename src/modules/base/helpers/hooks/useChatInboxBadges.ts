import {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import apiClient from "@baseModule/helpers/apiClient/apiClient.ts";
import {RootState, store} from "@coreModule/helpers/redux/store/generalStore.ts";
import {hydrateInboxBadges, resetChat} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import type {InboxBadgesFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/inboxBadges.form.response.type.ts";

/**
 * Runs once the authenticated panel shell is up (and again if the company changes).
 * Company switch via relogin keeps the Redux store; reset chat before re-seeding badges.
 */
export function useChatInboxBadges() {
    const dispatch = useDispatch();
    const companyId = useSelector((state: RootState) => state.authentication.user?.company?._id);

    useEffect(() => {
        if (!companyId) {
            return;
        }

        // Read from the store (not a hook ref): auth re-hydrate unmounts the sidebar on company switch.
        if (store.getState().chat.companyId !== companyId) {
            dispatch(resetChat(companyId));
        }

        const controller = new AbortController();
        apiClient.get<InboxBadgesFormResponseType>("/api/user/chats/channels/inboxBadges", {
            signal: controller.signal,
        })
            .then(({data: badges}) => {
                if (!controller.signal.aborted) {
                    dispatch(hydrateInboxBadges(badges));
                }
            })
            .catch(() => {
                // Badges must not take down the shell if chat APIs are briefly unavailable.
            });
        return () => {
            controller.abort();
        };
    }, [companyId, dispatch]);
}
