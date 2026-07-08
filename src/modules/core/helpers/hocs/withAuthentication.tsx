import {useEffect, useState} from "react";
import {LoaderCircle} from "lucide-react";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {signOut, updateToken, updateUserData} from "@coreModule/helpers/redux/slices/authSlice.ts";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@coreModule/components/ui/alert-dialog.tsx";
import {
    ValidateTokenFormResponseType
} from "armonia/src/modules/core/api/user/public/validateToken/validateToken.form.response.type.ts";
import {ComponentType} from "react";
import {compose} from "redux";

/** Delay (ms) before redirecting to login after session expiry dialog is shown. */
const SESSION_EXPIRED_REDIRECT_DELAY_MS = 3000;

/**
 * Higher-Order Component that guards routes by requiring a valid auth token.
 *
 * - Resolves token from Redux (`state.authentication.token`) or localStorage (e.g. after refresh).
 * - Calls `/api/user/validateToken` to validate the token and load user data.
 * - If valid: dispatches user data and token, then renders the wrapped component.
 * - If invalid or no token: shows "session expired" (when token was present) or redirects to login.
 *
 * The wrapped component receives all props passed to the enhanced component (including
 * `resolveLanguageKey` and other `withLanguage` props). Use this HOC for any route that
 * requires an authenticated user.
 *
 * @example
 * ```tsx
 * export default compose(
 *   withAuthentication(),
 * )(PrivateLayout);
 * ```
 */
const withAuthentication = () => <TProps extends object>(
    WrappedComponent: ComponentType<TProps & WithLanguageType>
) => {
    function EnhancedComponent_WithAuthentication(props: TProps & WithLanguageType) {
        const {resolveLanguageKey} = props;
        const dispatch = useDispatch();
        const [loading, setLoading] = useState<boolean>(true);
        const [failedAuthentication, setFailedAuthentication] = useState<boolean>(false);
        const loginToken = useSelector((state: RootState) => state.authentication.token);

        const goToLogin = () => {
            dispatch(signOut());
            window.location.href = "/authenticate/login";
            // navigate("/authenticate/login");
            setLoading(false);
            setFailedAuthentication(false);
        }

        useEffect(() => {
            setLoading(true);
            setFailedAuthentication(false);

            if (!loginToken) {
                goToLogin();
                return;
            }

            /**
             * Abort in-flight request on unmount or token changes.
             * Prevents dispatch/setState from stale responses after navigation.
             */
            const abortController = new AbortController();

            apiClient.get(`/api/user/validateToken`, {signal: abortController.signal})
                .then(({data,}: { data: ValidateTokenFormResponseType }) => {
                    if (abortController.signal.aborted) return;
                    dispatch(updateUserData(data));
                    dispatch(updateToken(loginToken));
                    setLoading(false);
                })
                .catch(() => {
                    if (abortController.signal.aborted) return;
                    setLoading(false);
                    setFailedAuthentication(true);
                    setTimeout(() => {
                        goToLogin();
                    }, SESSION_EXPIRED_REDIRECT_DELAY_MS);
                });
            return () => abortController.abort();
        }, [loginToken]);

        if (loading) {
            return (
                <AlertDialog open={true}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <div className="flex items-center space-x-1">
                                <LoaderCircle className="h-4 w-4 animate-spin"/>
                                <AlertDialogTitle
                                    className="">{props.resolveLanguageKey("verifying")}</AlertDialogTitle>
                            </div>
                            <AlertDialogDescription>
                                {props.resolveLanguageKey("loadingUser")}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </AlertDialogContent>
                </AlertDialog>
            );
        }

        if (failedAuthentication) {
            return (
                <AlertDialog open={true}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {resolveLanguageKey("sessionExpiredTitle")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {resolveLanguageKey("sessionExpiredDescription")}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <Button type="button" onClick={() => {
                                goToLogin();
                            }}>
                                {resolveLanguageKey("sessionExpiredOkButton")}
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )
        }

        if (!!loginToken) {
            return <WrappedComponent {...props} />
        }

        return <></>
    }

    return compose(withLanguage("src/modules/core/helpers/hocs/withAuthentication.tsx"))(
        EnhancedComponent_WithAuthentication as ComponentType<TProps & WithLanguageType>
    );
};

export default withAuthentication;
