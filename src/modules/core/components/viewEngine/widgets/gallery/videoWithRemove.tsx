import {IconPlayerPlay} from "@tabler/icons-react";
import {MediaWithRemove, type MediaWithRemoveProps} from "@coreModule/components/viewEngine/widgets/gallery/mediaWithRemove.tsx";

/** A video thumbnail with preview and remove actions. */
export function VideoWithRemove(props: MediaWithRemoveProps) {
    return (
        <MediaWithRemove
            {...props}
            fieldMediaType="video"
            PreviewIcon={IconPlayerPlay}
            thumbClassName="bg-muted"
            dialogClassName="w-auto"
        />
    );
}

export default VideoWithRemove;
