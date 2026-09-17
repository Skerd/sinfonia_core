import {lazy, Suspense, type ComponentType} from "react";
import type {SheetFieldRenderer} from "@baseModule/helpers/types/widgetContribution.types.ts";
import {normalizeObjectIdRef, resolvePath} from "../../engine/refs.ts";
import {omitProps, wpText} from "../../engine/widgetProps.ts";

/** Lazy-loaded to avoid a static import cycle (cards → sheet → ViewRenderer). */
const CountryCard = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/cardView/countryCard.tsx"));
const StateCard = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/states/center/cardView/stateCard.tsx"));
const CityCard = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/cities/center/cardView/cityCard.tsx"));
const CurrencyCard = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/currencies/center/cardView/currencyCard.tsx"));

/**
 * `#Tenancy*Card`: the ref at `field.name` (id string or partial/populated object) as a
 * read-only tenancy card that loads the full entity itself. `widgetProps.className` wraps
 * the card; every other widget prop goes to the card.
 */
function tenancyCardRenderer(Card: ComponentType<any>, entityProp: string): SheetFieldRenderer {
    return ({binding, ctx, index}) => {
        if (!ctx.data) return null;
        const ref = normalizeObjectIdRef(resolvePath(ctx.data, binding.name));
        if (!ref || typeof ref.stub._id !== "string") return null;

        const wp = binding.widgetProps ?? {};
        const wrapperClass = wpText(wp, "className");
        const card = (
            <Suspense key={wrapperClass ? undefined : index} fallback={null}>
                <Card {...omitProps(wp, "className")} {...{[entityProp]: ref.stub}} fetchId={ref.fetchId} hideActions />
            </Suspense>
        );
        return wrapperClass ? <div key={index} className={wrapperClass}>{card}</div> : card;
    };
}

export const tenancyCardRenderers: Record<string, SheetFieldRenderer> = {
    "#TenancyCountryCard": tenancyCardRenderer(CountryCard, "country"),
    "#TenancyStateCard": tenancyCardRenderer(StateCard, "state"),
    "#TenancyCityCard": tenancyCardRenderer(CityCard, "city"),
    "#TenancyCurrencyCard": tenancyCardRenderer(CurrencyCard, "currency"),
};
