import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Separator} from "@coreModule/components/ui/separator.tsx";
import Forbidden from "@coreModule/components/custom/pages/forbidden.tsx";
import {useAccessHydrated} from "@coreModule/helpers/context/accessContext.tsx";
import {useActionAccess} from "@coreModule/helpers/hooks/useActionAccess.ts";
import {useIsPlatformCompany} from "@coreModule/helpers/hooks/useIsPlatformCompany.ts";
import UploadReviewList, {UPLOAD_REVIEW_PAGE_SIZE} from "@coreModule/clients/panel/private/tenancy/uploadReview/uploadReviewList.tsx";

/**
 * The platform's upload review (D177): files the nudity check flagged in any company, waiting for a decision, and the
 * uploads it refused. Only the platform company reviews, with the permission `reviewUploads` of the platform-only
 * upload refusals.
 */
function UploadReview({resolveLanguageKey}: WithLanguageType) {
    const isPlatformCompany = useIsPlatformCompany();
    const canReview = useActionAccess("uploadrefusals", "reviewUploads");
    // The permission tag of a "loose" model is known only once the access map has loaded.
    if (useAccessHydrated() === false) return null;
    if (!isPlatformCompany || !canReview) return <Forbidden />;

    return (
        <div className="flex-full">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{resolveLanguageKey("title")}</h1>
                <p className="text-muted-foreground">{resolveLanguageKey("description")}</p>
                <Separator className="mt-2 mb-4" />
            </div>
            <UploadReviewList filter={{view: "flagged", page: 1, limit: UPLOAD_REVIEW_PAGE_SIZE}} />
        </div>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/uploadReview/index.tsx"),
)(UploadReview);
