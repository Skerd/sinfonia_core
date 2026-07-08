import {createContext, useCallback, useContext, useMemo, useState, type ReactNode} from "react";
import {useDispatch} from "react-redux";
import {useNavigate} from "react-router-dom";
import {logIn, signOut} from "@coreModule/helpers/redux/slices/authSlice.ts";
import useHttpRequest from "@coreModule/helpers/hooks/useHttpRequest.ts";
import type {ReloginDifferentCompanyFormResponseType} from "armonia/src/modules/core/api/user/private/login/reloginDifferentCompany.form.response.type.ts";

type ReloginContextValue = {
    triggerRelogin: (companyId: string) => void;
};

const ReloginContext = createContext<ReloginContextValue | undefined>(undefined);

export function ReloginProvider({children}: {children: ReactNode}) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [requestData, setRequestData] = useState<Record<string, unknown>>({});
    const [fetchCount, setFetchCount] = useState(0);

    useHttpRequest<ReloginDifferentCompanyFormResponseType>(
        {
            method: "post",
            url: "/api/user/login/differentCompany",
            data: {},
        },
        requestData,
        fetchCount,
        true,
        {
            success: (data) => {
                if (!!data?.token && !!data?.refreshToken) {
                    dispatch(logIn({token: data.token, refreshToken: data.refreshToken}));
                } else {
                    dispatch(signOut());
                }
            },
            error: () => {
                navigate("/authenticate/login");
                dispatch(signOut());
            },
        },
        {}
    );

    const triggerRelogin = useCallback((companyId: string) => {
        setRequestData({companyId});
        setFetchCount((c) => c + 1);
    }, []);

    const value = useMemo<ReloginContextValue>(
        () => ({triggerRelogin}),
        [triggerRelogin]
    );

    return (
        <ReloginContext.Provider value={value}>
            {children}
        </ReloginContext.Provider>
    );
}

export function useRelogin(): ReloginContextValue {
    const context = useContext(ReloginContext);
    if (context === undefined) {
        throw new Error("useRelogin must be used within a ReloginProvider");
    }
    return context;
}
