import {compose} from "redux";
import {useDispatch, useSelector} from "react-redux";
import {useNavigate} from "react-router-dom";
import {AlertCircle} from "lucide-react";
import {RootState} from "@coreModule/helpers/redux/store/generalStore.ts";
import {signOut} from "@coreModule/helpers/redux/slices/authSlice.ts";
import apiClient from "@coreModule/helpers/axiosClients/apiClient.ts";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";
import {Progress} from "@coreModule/components/ui/progress.tsx";
import {Spinner} from "@coreModule/components/ui/spinner.tsx";

export const SESSION_SETUP_TOTAL_STEPS = 6;
export const STUDIO_SESSION_SETUP_TOTAL_STEPS = 4;

type SessionSetupPhase = "auth" | "access" | "websocket" | "siteRoom" | "table" | "view";

type SessionSetupScreenProps = {
    step: number;
    total: number;
    phase: SessionSetupPhase;
    error: boolean;
    onRetry: () => void;
} & WithLanguageType;

function interpolate(template: string, vars: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (whole, key: string) => {
        const value = vars[key];
        return value == null ? whole : String(value);
    });
}

function displayNameFromUser(name: string, surname: string): string {
    return [name, surname].map((part) => part.trim()).filter(Boolean).join(" ");
}

function SessionSetupScreenComponent({
    step,
    total,
    phase,
    error,
    onRetry,
    resolveLanguageKey,
}: SessionSetupScreenProps) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const {name, surname} = useSelector((state: RootState) => state.authentication.user);
    const displayName = displayNameFromUser(name, surname);

    const hello = displayName
        ? interpolate(String(resolveLanguageKey("hello")), {name: displayName})
        : String(resolveLanguageKey("helloFallback"));
    const setupProgress = interpolate(String(resolveLanguageKey("setupProgress")), {
        current: step,
        total,
    });
    const status = String(resolveLanguageKey(error ? `fail.${phase}.title` : `fetching.${phase}`));
    const failDescription = String(resolveLanguageKey("fail.description"));
    const retryLabel = String(resolveLanguageKey("retry"));
    const signOutLabel = String(resolveLanguageKey("signOut"));

    const progressValue = (step / total) * 100;

    async function handleSignOut() {
        try {
            await apiClient.post("/api/user/userSession/currentRevoke");
        } catch {
            // Local logout must still complete when the network or session is already gone.
        } finally {
            dispatch(signOut());
            navigate("/authenticate/login");
        }
    }

    return (
        <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-background">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[220px] overflow-hidden" aria-hidden>
                <div
                    className="absolute left-1/2 top-0 h-40 w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.08] blur-3xl dark:opacity-[0.14]"
                    style={{background: "radial-gradient(ellipse, oklch(0.62 0.22 264) 0%, transparent 100%)"}}
                />
            </div>
            <div className="relative w-full max-w-md px-6">
                <p className="text-2xl font-semibold tracking-tight text-foreground">{hello}</p>
                <p className="mt-1 text-sm text-muted-foreground">{setupProgress}</p>
                <Progress
                    value={progressValue}
                    className="mt-6 h-1.5"
                    aria-valuetext={setupProgress}
                />
                <div className="mt-4 flex items-start gap-2 text-sm">
                    {error ? (
                        <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    ) : (
                        <Spinner className="mt-0.5 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                        <p className={error ? "font-medium text-destructive" : "text-muted-foreground"}>
                            {status}
                        </p>
                        {error ? (
                            <p className="mt-1 text-muted-foreground">{failDescription}</p>
                        ) : null}
                    </div>
                </div>
                {error ? (
                    <div className="mt-6 flex items-center justify-between gap-3">
                        <Button type="button" className="cursor-pointer" onClick={onRetry}>
                            {retryLabel}
                        </Button>
                        <Button type="button" variant="outline" className="cursor-pointer" onClick={handleSignOut}>
                            {signOutLabel}
                        </Button>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export const SessionSetupScreen = compose(
    withLanguage("src/modules/core/components/ui/sessionSetupScreen.tsx"),
)(SessionSetupScreenComponent);
