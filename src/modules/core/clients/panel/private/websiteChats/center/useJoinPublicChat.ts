import {useState} from "react";
import {useDispatch} from "react-redux";
import {decrementWaitingCount, openChannel, upsertChannel} from "@coreModule/helpers/redux/slices/chatSlice.ts";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import type {Channel} from "armonia/src/modules/core/api/user/private/chats/channels/channels.form.response.type.ts";

const JOIN_REQUEST = {method: "post" as const, url: "/api/user/chats/channels/join", data: {}};

export function useJoinPublicChat() {
    const dispatch = useDispatch();
    const [request, setRequest] = useState({body: {} as Record<string, unknown>, count: 0});

    // No translator, so no toasts: a rejected join (someone else took it) stays silent.
    const {loading: joining} = useHttpRequest<Channel>(JOIN_REQUEST, request.body, request.count, true, {
        success: (data) => {
            dispatch(upsertChannel(data));
            dispatch(decrementWaitingCount());
            dispatch(openChannel(data._id));
        },
    });

    function join(channelId: string) {
        if (!channelId || joining) {
            return;
        }
        setRequest((previous) => ({body: {_id: channelId}, count: previous.count + 1}));
    }

    return {joining, join};
}
