import {useEffect, useImperativeHandle, useState} from "react";
import {useParams} from "react-router-dom";
import type {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import type {ActivateAccountFormType} from "armonia/src/modules/core/api/user/public/activateAccount/activateAccount.form.type.ts";
import type {ActivateAccountFormResponseType} from "armonia/src/modules/core/api/user/public/activateAccount/activateAccount.form.response.type.ts";

/** Sends the `:code` route param to the activation endpoint once and reports how it went. */
export function usePublicActivateAccount({
    onFilterChange,
    innerRef,
}: Pick<WithAxiosType<ActivateAccountFormResponseType, ActivateAccountFormType>, "onFilterChange" | "innerRef">) {
    const params = useParams();
    const [phase, setPhase] = useState<"loading" | "success" | "error">("loading");

    useEffect(() => {
        const code = params.code;
        if (!code) {
            setPhase("error");
            return;
        }
        setPhase("loading");
        onFilterChange({code});
    }, [params.code, onFilterChange]);

    useImperativeHandle(innerRef, () => ({
        start: () => setPhase("loading"),
        success: () => setPhase("success"),
        error: () => setPhase("error"),
    }));

    return {phase};
}
