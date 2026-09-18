import {VideoWithRemove} from "@coreModule/components/custom/images/videoWithRemove.tsx";
import {MediaGalleryField, type GalleryFieldProps} from "@coreModule/components/custom/images/mediaGalleryField.tsx";

const MAX_VIDEOS = 3;
/** Video file names are long enough to blow out the thumbnail caption, so they are clipped. */
const ALT_NAME_LIMIT = 15;

/** Up to {@link MAX_VIDEOS} videos on the `videoGallery` form field. */
export function VideoGalleryField(props: GalleryFieldProps) {
    return (
        <MediaGalleryField
            {...props}
            fieldName="videoGallery"
            maxItems={MAX_VIDEOS}
            accept="video/*"
            labelKey="form.videoGalleryLabel"
            ItemComponent={VideoWithRemove}
            existingAlt={(position) => `Video ${position}`}
            fileAlt={(file) => file.name.substring(0, ALT_NAME_LIMIT)}
        />
    );
}

export default VideoGalleryField;
