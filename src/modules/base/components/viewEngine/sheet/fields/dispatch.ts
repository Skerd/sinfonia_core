import type {ReactNode} from "react";
import type {
    SheetFieldRenderer,
    SheetFieldRendererArgs,
} from "@baseModule/helpers/types/widgetContribution.types.ts";
import {getSheetFieldRenderer, resolveWidget} from "../../widgetRegistry.ts";
import {displayCardRenderer} from "../displayCard/renderDisplayCard.tsx";
import {addressRenderers} from "./addresses.tsx";
import {embeddedItemsRenderer} from "./embeddedItems.tsx";
import {mediaRenderers} from "./media.tsx";
import {referencesRenderer} from "./references.tsx";
import {simpleRenderers} from "./simple.tsx";
import {tenancyCardRenderers} from "./tenancyCards.tsx";

let coreRenderers: Record<string, SheetFieldRenderer> | undefined;

/** Core's sheet-field renderers. Built on first use: `#DisplayCard` and this module import each other. */
function coreRenderer(token: string): SheetFieldRenderer | undefined {
    coreRenderers ??= {
        ...tenancyCardRenderers,
        ...addressRenderers,
        ...mediaRenderers,
        ...simpleRenderers,
        "#ReferencesRender": referencesRenderer,
        "#SheetEmbeddedItemsList": embeddedItemsRenderer,
        "#DisplayCard": displayCardRenderer,
    };
    return Object.hasOwn(coreRenderers, token) ? coreRenderers[token] : undefined;
}

/**
 * Renders a sheet field (or a `#DisplayCard` body) through the renderer registered for
 * `token`: a module's first, then core's. `undefined` means no renderer claimed it and the
 * caller should fall back to the plain widget.
 */
export function renderSheetFieldToken(
    token: string,
    args: Omit<SheetFieldRendererArgs, "Component">,
): ReactNode | undefined {
    const full: SheetFieldRendererArgs = {...args, Component: resolveWidget(token)};
    const contributed = getSheetFieldRenderer(token)?.(full);
    if (contributed !== undefined) return contributed;
    return coreRenderer(token)?.(full);
}
