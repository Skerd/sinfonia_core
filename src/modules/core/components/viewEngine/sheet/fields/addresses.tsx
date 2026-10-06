import {createElement} from "react";
import type {SheetFieldRenderer} from "@coreModule/helpers/types/widgetContribution.types.ts";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import {resolvePath} from "../../engine/refs.ts";
import SheetCompanyAddressesSection from "../widgets/addresses/sheetCompanyAddressesSection.tsx";
import SheetAddressSection from "../widgets/addresses/sheetAddressSection.tsx";

export const addressRenderers: Record<string, SheetFieldRenderer> = {
    /** Every entry of `addresses[]` (or one embedded object) with its map. */
    "#SheetCompanyAddresses": ({binding, ctx, index}) => {
        if (!ctx.data) return null;
        const wp = binding.widgetProps ?? {};
        /** `"."` — the sheet row itself is the address (flat fields, not a nested `address`). */
        const addressField = typeof wp.addressField === "string" ? wp.addressField : binding.name;
        const addresses = addressField === "." ? ctx.data : resolvePath(ctx.data, addressField);
        return createElement(SheetCompanyAddressesSection, {
            key: index,
            addresses,
            resolveLanguageKey: ctx.resolveLanguageKey,
        });
    },

    /** One embedded address; a single summary card in compact references mode. */
    "#SheetAddressSection": ({binding, ctx, index}) => {
        if (!ctx.data) return null;
        return createElement(SheetAddressSection, {
            key: index,
            address: resolvePath(ctx.data, binding.name),
            resolveLanguageKey: ctx.resolveLanguageKey,
        });
    },

    "#EmbeddedAddressCard": ({binding, ctx, index, Component}) => {
        if (!Component) return null;
        const wp = binding.widgetProps ?? {};
        const address = ctx.data ? resolvePath(ctx.data, binding.name) : wp.address;
        if (address == null) return createElement(ValueNotSet, {key: index});
        return createElement(Component, {...wp, key: index, address});
    },
};
