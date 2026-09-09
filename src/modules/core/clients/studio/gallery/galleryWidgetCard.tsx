import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {Card, CardContent, CardHeader, CardTitle} from "@coreModule/components/ui/card.tsx";
import {getWidgetMeta} from "@coreModule/components/viewEngine/widgetRegistry.ts";
import GalleryErrorBoundary from "./galleryErrorBoundary.tsx";
import GalleryFormMount from "./galleryFormMount.tsx";
import GallerySheetMount from "./gallerySheetMount.tsx";
import GalleryOverlayMount from "./galleryOverlayMount.tsx";
import GalleryEntityMount from "./galleryEntityMount.tsx";
import {
    classifyGalleryToken,
    formDefaultValues,
    formViewConfig,
    sheetRow,
    sheetViewConfig,
    type GalleryEntry,
} from "./gallerySpecs.ts";
import {galleryEntityStub} from "./galleryEntity.ts";

type GalleryWidgetCardProps = {
    entry: GalleryEntry;
    showForm: boolean;
    showSheet: boolean;
    resolveLanguageKey: ResolveLanguageKey;
};

function tokenAnchor(token: string): string {
    return token.replace(/^#/, "");
}

export default function GalleryWidgetCard({
    entry,
    showForm,
    showSheet,
    resolveLanguageKey,
}: GalleryWidgetCardProps) {
    const modes = classifyGalleryToken(entry.token);
    const meta = getWidgetMeta(entry.token);
    const form = showForm && modes.form;
    const entityCard = showSheet && modes.entityCard && !modes.overlay;
    const sheet = showSheet && modes.sheet && !modes.overlay && !modes.entityCard;
    const overlay = showSheet && modes.overlay;

    if (!form && !sheet && !overlay && !entityCard) return null;

    return (
        <Card
            id={tokenAnchor(entry.token)}
            size="sm"
            className="scroll-mt-20"
        >
            <CardHeader className="border-b">
                <CardTitle className="flex flex-wrap items-center gap-2 font-mono text-sm">
                    {entry.token}
                    {modes.form && (
                        <Badge variant="outline" className="font-sans text-3xs">
                            form
                        </Badge>
                    )}
                    {modes.sheet && (
                        <Badge variant="outline" className="font-sans text-3xs">
                            {modes.overlay ? "overlay" : modes.entityCard ? "card" : "sheet"}
                        </Badge>
                    )}
                </CardTitle>
                {meta?.docs && (
                    <p className="text-2xs text-muted-foreground">{meta.docs}</p>
                )}
            </CardHeader>
            <CardContent className="flex flex-col gap-6 pt-4">
                {form && (
                    <section className="flex flex-col gap-2">
                        {sheet || overlay || entityCard ? (
                            <p className="text-3xs font-medium uppercase tracking-wide text-muted-foreground">
                                Form
                            </p>
                        ) : null}
                        <GalleryErrorBoundary token={`${entry.token}:form`}>
                            <GalleryFormMount
                                config={formViewConfig(entry.token)}
                                defaultValues={formDefaultValues(entry.token)}
                                resolveLanguageKey={resolveLanguageKey}
                                formExtras={
                                    entry.token === "#UnitCard"
                                        ? {cashSaleUnitSnapshot: galleryEntityStub()}
                                        : undefined
                                }
                            />
                        </GalleryErrorBoundary>
                    </section>
                )}
                {entityCard && (
                    <section className="flex flex-col gap-2">
                        {form ? (
                            <p className="text-3xs font-medium uppercase tracking-wide text-muted-foreground">
                                Card
                            </p>
                        ) : null}
                        <GalleryErrorBoundary token={`${entry.token}:card`}>
                            <GalleryEntityMount token={entry.token} />
                        </GalleryErrorBoundary>
                    </section>
                )}
                {sheet && (
                    <section className="flex flex-col gap-2">
                        {form ? (
                            <p className="text-3xs font-medium uppercase tracking-wide text-muted-foreground">
                                Sheet
                            </p>
                        ) : null}
                        <GalleryErrorBoundary token={`${entry.token}:sheet`}>
                            <GallerySheetMount
                                config={sheetViewConfig(entry.token)}
                                row={sheetRow(entry.token)}
                                resolveLanguageKey={resolveLanguageKey}
                            />
                        </GalleryErrorBoundary>
                    </section>
                )}
                {overlay && (
                    <GalleryErrorBoundary token={`${entry.token}:overlay`}>
                        <GalleryOverlayMount token={entry.token} />
                    </GalleryErrorBoundary>
                )}
            </CardContent>
        </Card>
    );
}
