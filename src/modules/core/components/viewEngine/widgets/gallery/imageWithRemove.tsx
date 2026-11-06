import {IconEye} from "@tabler/icons-react";
import {MediaWithRemove, type MediaWithRemoveProps} from "@coreModule/components/viewEngine/widgets/gallery/mediaWithRemove.tsx";

/** An image thumbnail with preview and remove actions. */
export function ImageWithRemove(props: MediaWithRemoveProps) {
    return <MediaWithRemove {...props} fieldMediaType="image" PreviewIcon={IconEye}/>;
}

export default ImageWithRemove;
