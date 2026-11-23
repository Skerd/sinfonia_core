import {IconHourglass, IconEyeOff} from "@tabler/icons-react";
import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import useHttpRequest, {type HttpRequest} from "@coreModule/helpers/hooks/useHttpRequest.ts";
import {Alert, AlertDescription, AlertTitle} from "@coreModule/components/ui/alert.tsx";
import type {Company} from "armonia/src/modules/core/api/company/private/company/company.dto.ts";

const COMPANY_REQUEST: HttpRequest = {method: "get", url: "/api/company"};

/** What the owner should know about the portal listing: waiting for the platform's check, or turned down (TD-F159). */
export function portalListingNoticeOf(company: Pick<Company, "portalApproval"> | null | undefined): "pending" | "rejected" | null {
    const status = company?.portalApproval?.status;
    return status === "pending" || status === "rejected" ? status : null;
}

/**
 * On the panel home of a self-serve business (D178): until the platform approves it, the portal's home page does not
 * list it, though its own site works. Said here, so the owner is not left wondering why nobody finds them.
 */
export default function PortalListingNotice({resolveLanguageKey: t}: {resolveLanguageKey: ResolveLanguageKey}) {
    // `GET /api/company` answers the company itself, with no `data` wrapper.
    const {data: company} = useHttpRequest<Company>(COMPANY_REQUEST, {}, 1);
    const notice = portalListingNoticeOf(company);
    if (!notice) return null;
    const reason = notice === "rejected" ? company?.portalApproval?.reason : undefined;
    return (
        <Alert className="z-10">
            {notice === "pending" ? <IconHourglass aria-hidden /> : <IconEyeOff aria-hidden />}
            <AlertTitle>{t(`home.listing.${notice}Title`)}</AlertTitle>
            <AlertDescription>
                <p>{t(`home.listing.${notice}Text`)}</p>
                {reason ? <p>{String(t("home.listing.reason")).replace("{reason}", reason)}</p> : null}
            </AlertDescription>
        </Alert>
    );
}
