import {Eye} from "lucide-react";
import {MediaWithRemove, type MediaWithRemoveProps} from "@coreModule/components/custom/images/mediaWithRemove.tsx";

/** An image thumbnail with preview and remove actions. */
export function ImageWithRemove(props: MediaWithRemoveProps) {
    return <MediaWithRemove {...props} fieldMediaType="image" PreviewIcon={Eye}/>;
}

export default ImageWithRemove;
