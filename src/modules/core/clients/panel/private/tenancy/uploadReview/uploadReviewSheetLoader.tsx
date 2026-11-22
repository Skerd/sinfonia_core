import {useEffect} from "react";
import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import UploadReviewSheet from "@coreModule/clients/panel/private/tenancy/uploadReview/uploadReviewSheet.tsx";
import type {UploadReviewItem} from "armonia/src/modules/core/api/auxiliary/private/uploadReview/uploadReview.dto.ts";

type LoaderOwnProps = {
    /** The file named in the address. */
    mediaId: string;
    onClose: () => void;
    onDecided: () => void;
};

/**
 * Opens the sheet of a file named in the address (`?open=`, from a notice): reads the file, then shows its sheet. Asks
 * itself (`withAxios` child mode) so a file that cannot be opened clears the address instead of showing a load error.
 */
function UploadReviewSheetLoader({mediaId, data, error, onFilterChange, onClose, onDecided}: LoaderOwnProps & WithLanguageType & WithAxiosType<UploadReviewItem>) {
    useEffect(() => {
        onFilterChange({_id: mediaId});
    }, [mediaId, onFilterChange]);
    // A file no longer under review (decided elsewhere, deleted): the error toast says so and the address is cleared.
    useEffect(() => {
        if (error) onClose();
    }, [error, onClose]);
    if (!data) return null;
    return <UploadReviewSheet open onOpenChange={(open: boolean) => { if (!open) onClose(); }} item={data} onDecided={onDecided} />;
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/uploadReview/uploadReviewSheetLoader.tsx"),
    withAxios<UploadReviewItem>({method: "POST", url: "/api/auxiliary/uploadReview/single", data: {}}, true),
    withDebug(true, true, "uploadrefusals"),
)(UploadReviewSheetLoader);
