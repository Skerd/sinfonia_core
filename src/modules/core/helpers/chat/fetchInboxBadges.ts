import {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {hydrateInboxBadges} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import {InboxBadgesFormResponseType} from "armonia/src/modules/core/api/user/private/chats/channels/inboxBadges.form.response.type.ts";

/**
 * Runs once the authenticated panel shell is up (and again if the company changes).
 */
export function useFetchChatInboxBadgesOnPanelLoad() {
    const dispatch = useDispatch();
    const companyId = useSelector((state: RootState) => state.authentication.user?.company?._id);

    useEffect(() => {
        if (!companyId) {
            return;
        }
        let cancelled = false;
        apiClient.get<InboxBadgesFormResponseType>("/api/user/chats/channels/inbox-badges")
            .then(({data: badges}) => {
                if (!cancelled) {
                    dispatch(hydrateInboxBadges(badges));
                }
            })
            .catch(() => {
                // Badges must not take down the shell if chat APIs are briefly unavailable.
            });
        return () => {
            cancelled = true;
        };
    }, [companyId, dispatch]);
}
