import {Suspense} from "react";
import {
    getReferencesDefaultItemProp,
    resolveWidget,
} from "@coreModule/components/viewEngine/widgetRegistry.ts";
import {AccessAllowAllProvider} from "@coreModule/helpers/context/accessContext.tsx";
import {entityPropName, galleryCardExtraProps, galleryEntityStub} from "./galleryEntity.ts";

type GalleryEntityMountProps = {
    token: string;
};

/**
 * Mounts a `*Card` the way a list page does: the real widget, a stub entity, no fetch.
 *
 * ViewRenderer's generic sheet branch only spreads `widgetProps`. Entity cards read a
 * named prop (`category`, `unit`) and immediately touch `entity.deletedAt` — an empty
 * spread leaves that undefined and throws.
 */
export default function GalleryEntityMount({token}: GalleryEntityMountProps) {
    const Widget = resolveWidget(token);

    if (!Widget) {
        return <p className="text-2xs text-muted-foreground">{token} is not registered.</p>;
    }

    const entity = galleryEntityStub();
    const prop = entityPropName(token, getReferencesDefaultItemProp(token));

    return (
        <AccessAllowAllProvider>
            <Suspense fallback={<p className="text-2xs text-muted-foreground">Loading {token}…</p>}>
                <Widget {...galleryCardExtraProps()} {...{[prop]: entity}} />
            </Suspense>
        </AccessAllowAllProvider>
    );
}
