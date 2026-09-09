import {Suspense, useState} from "react";
import {
    getReferencesDefaultItemProp,
    resolveWidget,
} from "@coreModule/components/viewEngine/widgetRegistry.ts";
import {Button} from "@coreModule/components/ui/button.tsx";
import {AccessAllowAllProvider} from "@coreModule/helpers/context/accessContext.tsx";
import {entityPropName, galleryCardExtraProps, galleryEntityStub} from "./galleryEntity.ts";

type GalleryOverlayMountProps = {
    token: string;
};

/**
 * Linked `*SheetView` widgets are overlays. The gallery never auto-opens them —
 * one click mounts the real component with a stub entity, the same way a `#DisplayCard`
 * linked sheet would.
 */
export default function GalleryOverlayMount({token}: GalleryOverlayMountProps) {
    const [open, setOpen] = useState(false);
    const Widget = resolveWidget(token);

    if (!Widget) {
        return <p className="text-2xs text-muted-foreground">{token} is not registered.</p>;
    }

    const entity = galleryEntityStub();
    const prop = entityPropName(token, getReferencesDefaultItemProp(token));

    return (
        <div className="flex flex-col items-start gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
                Open overlay
            </Button>
            {open && (
                <AccessAllowAllProvider>
                    <Suspense fallback={<p className="text-2xs text-muted-foreground">Loading…</p>}>
                        <Widget
                            open={open}
                            onOpenChange={setOpen}
                            {...galleryCardExtraProps()}
                            {...{[prop]: entity}}
                        />
                    </Suspense>
                </AccessAllowAllProvider>
            )}
        </div>
    );
}
