import {type ReactNode} from "react";
import {useLocation} from "react-router-dom";
import {SiApple, SiGoogle} from "@icons-pack/react-simple-icons";
import {getClientConfig} from "@coreModule/helpers/general/config.ts";
import mainConfig from "@coreModule/assets/languages/mainConfig.json";
import type {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {safeNextPath} from "@coreModule/helpers/publicAuth/safeNextPath.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {portalApexOrigin} from "../shared/portalZone.ts";

const PARTY_ICONS: Record<string, ReactNode> = {
    google: <SiGoogle />,
    apple: <SiApple />,
};

/**
 * Providers only accept registered redirect URIs, so every sign-in returns to the apex;
 * `state` carries where to go next, on this site.
 */
function authorizeUrl(partyUrl: string, platform: string, next: string): string {
    const parsed = new URL(partyUrl);
    parsed.searchParams.set("redirect_uri", `${portalApexOrigin()}/login/${platform}`);
    parsed.searchParams.set("state", `${window.location.origin}${next}`);
    return parsed.toString();
}

type PortalThirdPartyAuthenticationProps = Pick<WithLanguageType, "resolveLanguageKey"> & {
    loading?: boolean;
};

/** Sign in with Google or Apple, when the deployment turns it on. */
export default function PortalThirdPartyAuthentication({resolveLanguageKey, loading = false}: PortalThirdPartyAuthenticationProps) {
    const location = useLocation();
    const parties = mainConfig.thirdPartyAuthenticators;
    if (!getClientConfig().layout.activateThirdPartyAuthentication || parties.length === 0) return null;
    const next = safeNextPath(location.search, "/account");

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
                <span className="h-px flex-1 bg-border" />
                {resolveLanguageKey("orContinueWith")}
                <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-2">
                {parties.map((party) => (
                    <Button
                        key={party.name}
                        type="button"
                        variant="outline"
                        size="lg"
                        disabled={loading}
                        className="capitalize"
                        onClick={() => { window.location.href = authorizeUrl(party.url, party.name, next); }}
                    >
                        <span aria-hidden>{PARTY_ICONS[party.name]}</span>
                        {party.name}
                    </Button>
                ))}
            </div>
        </div>
    );
}
