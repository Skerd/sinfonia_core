import {useState} from "react";
import {useDispatch} from "react-redux";
import {decrementWaitingCount, openChannel, upsertChannel} from "@baseModule/helpers/redux/slices/chatSlice.ts";
import apiClient from "@baseModule/helpers/apiClient/apiClient.ts";
import type {Channel} from "armonia/src/modules/core/api/user/private/chats/channels/channels.form.response.type.ts";

export function useJoinPublicChat() {
    const dispatch = useDispatch();
    const [joining, setJoining] = useState(false);

    async function join(channelId: string) {
        if (!channelId || joining) {
            return;
        }
        setJoining(true);
        try {
            const {data} = await apiClient.post<Channel>(
                "/api/user/chats/channels/join",
                {_id: channelId},
            );
            dispatch(upsertChannel(data));
            dispatch(decrementWaitingCount());
            dispatch(openChannel(data._id));
        }
        catch {
            // Someone else took it, or the join was rejected.
        }
        finally {
            setJoining(false);
        }
    }

    return {joining, join};
}
