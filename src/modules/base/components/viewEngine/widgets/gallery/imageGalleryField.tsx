import {ImageWithRemove} from "@baseModule/components/viewEngine/widgets/gallery/imageWithRemove.tsx";
import {MediaGalleryField, type GalleryFieldProps} from "@baseModule/components/viewEngine/widgets/gallery/mediaGalleryField.tsx";

const MAX_IMAGES = 10;

/** Up to {@link MAX_IMAGES} images on the `imageGallery` form field. */
export function ImageGalleryField(props: GalleryFieldProps) {
    return (
        <MediaGalleryField
            {...props}
            fieldName="imageGallery"
            maxItems={MAX_IMAGES}
            accept="image/*"
            labelKey="form.imageGalleryLabel"
            ItemComponent={ImageWithRemove}
            existingAlt={(position) => `Gallery ${position}`}
            fileAlt={(file) => file.name}
        />
    );
}

export default ImageGalleryField;
