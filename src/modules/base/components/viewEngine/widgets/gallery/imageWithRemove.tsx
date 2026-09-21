import {Eye} from "lucide-react";
import {MediaWithRemove, type MediaWithRemoveProps} from "@baseModule/components/viewEngine/widgets/gallery/mediaWithRemove.tsx";

/** An image thumbnail with preview and remove actions. */
export function ImageWithRemove(props: MediaWithRemoveProps) {
    return <MediaWithRemove {...props} fieldMediaType="image" PreviewIcon={Eye}/>;
}

export default ImageWithRemove;
