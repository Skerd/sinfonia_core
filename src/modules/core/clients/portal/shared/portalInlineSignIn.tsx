import type {ComponentType} from "react";
import {Link} from "react-router-dom";
import {compose} from "redux";
import withLanguage, {type WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {Button} from "@coreModule/components/ui/button.tsx";

type PortalInlineSignInProps = WithLanguageType & {
    /** Where the visitor comes back to after signing in. */
    next: string;
    /** What signing in unlocks, in the caller's own words ("Log in to order this service."). */
    message: string;
};

/** One line asking a signed-out visitor to sign in, next to the action that needs it. */
function PortalInlineSignInInner({resolveLanguageKey, next, message}: PortalInlineSignInProps) {
    const loginTo = `/login?next=${encodeURIComponent(next)}`;
    return (
        <p className="text-xs text-muted-foreground">
            {message}{" "}
            <Button asChild variant="link" className="h-auto p-0 text-xs"><Link to={loginTo}>{resolveLanguageKey("logIn")}</Link></Button>
            {" · "}
            <Button asChild variant="link" className="h-auto p-0 text-xs"><Link to="/signup">{resolveLanguageKey("signUp")}</Link></Button>
        </p>
    );
}

export const PortalInlineSignIn = compose(
    withLanguage("src/modules/core/clients/portal/shared/portalInlineSignIn.tsx"),
    withDebug(true, true),
)(PortalInlineSignInInner) as ComponentType<{next: string; message: string}>;
