import {Play} from "lucide-react";
import {MediaWithRemove, type MediaWithRemoveProps} from "@coreModule/components/custom/images/mediaWithRemove.tsx";

/** A video thumbnail with preview and remove actions. */
export function VideoWithRemove(props: MediaWithRemoveProps) {
    return (
        <MediaWithRemove
            {...props}
            fieldMediaType="video"
            PreviewIcon={Play}
            thumbClassName="bg-muted"
            dialogClassName="w-auto"
        />
    );
}

export default VideoWithRemove;
