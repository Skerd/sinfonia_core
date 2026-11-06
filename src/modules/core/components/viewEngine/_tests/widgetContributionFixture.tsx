/**
 * A stand-in module widget contribution for the viewEngine tests, so core tests never import a vertical (CORE-01).
 * It has what a real module contributes: compound form renderers, one renderer that can render nothing, and edit-form
 * write keys for widgets whose field name is not a schema path.
 */
import type {CompoundFormWidgetRenderer} from "@coreModule/helpers/types/widgetContribution.types.ts";

/** Forwards the form state, the resolved label and the widget props (which win). */
const forwarding: CompoundFormWidgetRenderer = ({Widget, binding, resolveLanguageKey, extra}) => (
    <Widget
        name={binding.name}
        label={binding.label ? String(resolveLanguageKey(binding.label)) : undefined}
        resolveLanguageKey={resolveLanguageKey}
        loading={extra?.loading ?? false}
        {...binding.widgetProps}
    />
);

/** Renders only when the form extras hold the record it shows. */
const fromFormExtras: CompoundFormWidgetRenderer = ({Widget, extra}) => {
    const record = extra?.formExtras?.fixtureRecord;
    return record ? <Widget record={record} /> : null;
};

export const fixtureFormWidgetRenderers: Record<string, CompoundFormWidgetRenderer> = {
    "#FixturePolygon": forwarding,
    "#FixtureOutline": forwarding,
    "#FixtureShape": forwarding,
    "#FixtureItems": forwarding,
    "#FixtureRecordCard": fromFormExtras,
};

export const fixtureFormWriteAccessKeys: Record<string, string> = {
    "#FixturePolygon": "polygonCoordinates",
    "#FixtureOutline": "polygonCoordinates",
    "#FixtureShape": "polygonCoordinates",
    "#FixtureItems": "lineItems",
};
