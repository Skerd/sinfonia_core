import {
    cloneElement,
    createElement,
    isValidElement,
    lazy,
    Suspense,
    type ComponentType,
    type ReactNode,
} from "react";
import { format, isValid } from "date-fns";
import type { ViewNode, FieldBinding } from "armonia/src/modules/core/api/auxiliary/private/viewConfig";
import type { ResolveLanguageKey } from "@coreModule/helpers/hocs/withLanguage.tsx";
import { Badge } from "@coreModule/components/ui/badge.tsx";
import HiddenElement from "@coreModule/components/custom/hiddenElement.tsx";
import { MdiIcon } from "@coreModule/components/custom/mdiIcons/mdiIcon.tsx";
import { cn } from "@coreModule/components/lib/utils.ts";
import {
    getReferencesDefaultItemProp,
    getSheetFieldRenderer,
    resolveWidget,
    resolveIcon,
} from "./widgetRegistry.ts";
import ValueNotSet from "@coreModule/components/custom/valueNotSet.tsx";
import type { DisplayCardLinkedSheetOuterProps } from "@coreModule/components/custom/displayValue/displayCard.tsx";
import type { Country } from "armonia/src/modules/core/api/auxiliary/private/country/country.dto.ts";
import type { State } from "armonia/src/modules/core/api/auxiliary/private/state/state.dto.ts";
import type { City } from "armonia/src/modules/core/api/auxiliary/private/city/city.dto.ts";
import type { Currency } from "armonia/src/modules/core/api/finance/private/currency/currency.dto.ts";
import SheetPaginatedReferenceCardList, {
    type ReferenceStub,
} from "./sheetPaginatedReferenceCardList.tsx";
import { useReferencesViewModeOptional } from "./referencesViewModeContext.tsx";
import type { ReferenceCompactRowConfig } from "./referenceStubCompactRow.tsx";
import SheetCompanyAddressesSection from "./sheetCompanyAddressesSection.tsx";
import SheetAddressSection from "./sheetAddressSection.tsx";
import SheetEmbeddedItemsList, { type EmbeddedItemFieldConfig } from "./sheetEmbeddedItemsList.tsx";
import {
    filterAccessibleValuePath,
    hasAccessPath,
    hasDisplayCardValueAccess,
    normalizeObjectIdRef,
    resolvePath,
    type ViewRendererContext,
} from "./viewRendererHelpers.ts";

export type { ViewRendererContext };
export { hasAccessPath, hasDisplayCardValueAccess, normalizeObjectIdRef, resolvePath };

/**
 * Build the structured stub `DisplayValue` `type="currency"` expects from a
 * `valuePath` like `["priceCurrency.symbol", "price"]`. Joining into a string
 * ("€ 123") fails currency formatting and shows ValueNotSet ("!").
 */
function currencyStubFromValuePath(
    parent: Record<string, unknown>,
    valuePath: string[],
): {amount: number; currency?: {symbol?: string; abbreviation?: string}} | null {
    let amount: number | null = null;
    let symbol: string | undefined;
    let abbreviation: string | undefined;

    for (const path of valuePath) {
        const part = resolvePath(parent, path);
        const leaf = path.includes(".") ? path.slice(path.lastIndexOf(".") + 1) : path;
        if (leaf === "symbol" && part != null && String(part).trim() !== "") {
            symbol = String(part).trim();
            continue;
        }
        if (leaf === "abbreviation" && part != null && String(part).trim() !== "") {
            abbreviation = String(part).trim();
            continue;
        }
        if (typeof part === "number" && Number.isFinite(part)) {
            amount = part;
            continue;
        }
        if (typeof part === "string" && part.trim() !== "" && Number.isFinite(Number(part))) {
            amount = Number(part);
            continue;
        }
        if (part != null && typeof part === "object" && typeof (part as {toString?: () => string}).toString === "function") {
            const asString = (part as {toString: () => string}).toString();
            if (asString && asString !== "[object Object]" && Number.isFinite(Number(asString))) {
                amount = Number(asString);
            }
        }
    }

    if (amount == null) return null;
    if (symbol || abbreviation) {
        return {amount, currency: {symbol, abbreviation}};
    }
    return {amount};
}

/** Lazy-loaded to avoid a static import cycle (cards → sheet → ViewRenderer). */
const TenancyCountryCardLazy = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/countries/center/cardView/countryCard.tsx"));
const TenancyStateCardLazy = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/states/center/cardView/stateCard.tsx"));
const TenancyCurrencyCardLazy = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/currencies/center/cardView/currencyCard.tsx"));
const TenancyCityCardLazy = lazy(() => import("@coreModule/clients/panel/private/tenancy/systemSettings/cities/center/cardView/cityCard.tsx"));

/**
 * Resolves which card widget and prop name to use for `#ReferencesRender`.
 * Prefers `cardWidget` + optional `itemDataProp`; falls back to legacy `referenceKind`.
 * Module contributions register default prop names via `referencesDefaultItemProps`.
 */
export function resolveReferencesCardBinding(wp: Record<string, any>): { cardToken: string; itemDataProp: string } {
    if (typeof wp.cardWidget === "string" && wp.cardWidget.startsWith("#")) {
        const itemDataProp =
            typeof wp.itemDataProp === "string" && wp.itemDataProp.length > 0
                ? wp.itemDataProp
                : (getReferencesDefaultItemProp(wp.cardWidget) ?? "item");
        return { cardToken: wp.cardWidget, itemDataProp };
    }
    const kind = wp.referenceKind === "modificationRequest" ? "modificationRequest" : "inspection";
    if (kind === "modificationRequest") {
        return { cardToken: "#ModificationRequestCard", itemDataProp: "request" };
    }
    return { cardToken: "#InspectionCard", itemDataProp: "inspection" };
}

function ReferencesRenderHost(props: {
    node: ViewNode;
    binding: FieldBinding;
    ctx: ViewRendererContext;
    index: number;
}): ReactNode {
    const { node, binding, ctx, index } = props;
    const viewModeCtx = useReferencesViewModeOptional();
    const displayMode = viewModeCtx?.mode ?? "cards";
    const { data, access } = ctx;
    const wp = binding.widgetProps ?? {};
    const show = !(node.permissions?.read && !hasAccessPath(access, node.permissions.read));
    if (!show || !data) {
        return null;
    }

    const raw = resolvePath(data, binding.name);
    let items: unknown[] = [];
    if (Array.isArray(raw)) {
        items = raw.filter((x: unknown) => x != null && typeof (x as { _id?: unknown })._id === "string");
    } else if (raw != null && typeof raw === "object" && typeof (raw as { _id?: unknown })._id === "string") {
        items = [raw];
    } else if (typeof raw === "string" && raw.trim().length > 0) {
        /** Unit `sale` / `reservation` may be an unpopulated ObjectId string — mirrors `#UnitSaleCard` normalization. */
        items = [{ _id: raw }];
    }

    const refCtx = ctx.referenceCardUnitContext;
    const unitObj = data.unit;
    const unitId =
        (typeof refCtx?.unitId === "string" && refCtx.unitId) ||
        (typeof unitObj?._id === "string" ? unitObj._id : "") ||
        (typeof data._id === "string" ? data._id : "");
    const unitName =
        (typeof refCtx?.unitName === "string" && refCtx.unitName) ||
        (typeof unitObj?.name === "string" && unitObj.name) ||
        (typeof unitObj?.unitNumber === "string" && unitObj.unitNumber) ||
        (typeof data.name === "string" && data.name) ||
        (typeof data.unitNumber === "string" && data.unitNumber) ||
        unitId;

    const { cardToken, itemDataProp } = resolveReferencesCardBinding(wp);
    const Card = resolveWidget(cardToken) as ComponentType<any> | null;
    if (!Card) {
        console.warn(`[ViewRenderer] Unknown references card widget: ${cardToken}`);
        return null;
    }

    let compactRow: ReferenceCompactRowConfig | undefined;
    if (wp.compactRow != null && typeof wp.compactRow === "object" && !Array.isArray(wp.compactRow)) {
        compactRow = wp.compactRow as ReferenceCompactRowConfig;
    }

    const effectiveDisplayMode =
        displayMode === "compact" && compactRow != null ? "compact" : "cards";

    const pageSize =
        typeof wp.pageSize === "number" && Number.isFinite(wp.pageSize) && wp.pageSize >= 1
            ? Math.floor(wp.pageSize)
            : undefined;
    const cardProps =
        wp.cardProps != null && typeof wp.cardProps === "object" && !Array.isArray(wp.cardProps)
            ? (wp.cardProps as Record<string, unknown>)
            : undefined;

    return createElement(SheetPaginatedReferenceCardList, {
        key: index,
        Card,
        itemDataProp,
        items: items as ReferenceStub[],
        unitId,
        unitName,
        pageSize,
        cardProps,
        hideActions: wp.hideActions === true,
        listClassName: typeof wp.listClassName === "string" ? wp.listClassName : undefined,
        displayMode: effectiveDisplayMode,
        compactRow: effectiveDisplayMode === "compact" ? compactRow : undefined,
        show,
        sheetLanguageKey: ctx.resolveLanguageKey,
    });
}

function SheetEmbeddedItemsListHost(props: {
    node: ViewNode;
    binding: FieldBinding;
    ctx: ViewRendererContext;
    index: number;
}): ReactNode {
    const { node, binding, ctx, index } = props;
    const viewModeCtx = useReferencesViewModeOptional();
    const displayMode = viewModeCtx?.mode ?? "cards";
    const { data, access, resolveLanguageKey } = ctx;
    const wp = binding.widgetProps ?? {};

    const show = !(node.permissions?.read && !hasAccessPath(access, node.permissions.read));
    if (!show || !data) return null;

    const raw = resolvePath(data, binding.name);
    const items = Array.isArray(raw) ? raw : [];
    if (items.length === 0) return <ValueNotSet key={index} />;

    const pageSize =
        typeof wp.pageSize === "number" && Number.isFinite(wp.pageSize) && wp.pageSize >= 1
            ? Math.floor(wp.pageSize)
            : undefined;

    const compactSummaryFields = Array.isArray(wp.compactSummaryFields)
        ? (wp.compactSummaryFields as string[]).filter((f) => typeof f === "string" && f.length > 0)
        : undefined;

    const cardColumns =
        typeof wp.cardColumns === "number" && Number.isFinite(wp.cardColumns) && wp.cardColumns >= 2
            ? Math.min(4, Math.floor(wp.cardColumns))
            : undefined;

    return createElement(SheetEmbeddedItemsList, {
        key: index,
        items,
        fields: (wp.fields ?? []) as EmbeddedItemFieldConfig[],
        compactSummaryField: typeof wp.compactSummaryField === "string" ? wp.compactSummaryField : undefined,
        compactSummaryFields,
        compactSummaryJoinSeparator:
            typeof wp.compactSummaryJoinSeparator === "string" ? wp.compactSummaryJoinSeparator : undefined,
        displayMode,
        cardColumns,
        pageSize,
        listClassName: typeof wp.listClassName === "string" ? wp.listClassName : undefined,
        sortField: typeof wp.sortField === "string" ? wp.sortField : undefined,
        sortDescending: wp.sortDescending !== false,
        sheetLanguageKey: resolveLanguageKey,
    });
}

type ViewRendererProps = {
    nodes: ViewNode[];
    ctx: ViewRendererContext;
};

export default function ViewRenderer({ nodes, ctx }: ViewRendererProps) {
    return <>{renderNodes(nodes, ctx)}</>;
}

function renderNodes(nodes: ViewNode[], ctx: ViewRendererContext): ReactNode[] {
    return nodes.map((node, i) => renderNode(node, ctx, i));
}

/** True when a `dependent` path should hide the subtree (empty arrays, or objects whose values are only null/empty arrays). */
function dependentValueEffectivelyAbsent(value: unknown): boolean {
    if (value == null || value === false || value === "") return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value !== "object") return false;
    const vals = Object.values(value as Record<string, unknown>);
    if (vals.length === 0) return true;
    return vals.every((v) => v == null || (Array.isArray(v) && v.length === 0));
}

function renderNode(node: ViewNode, ctx: ViewRendererContext, index: number): ReactNode {

    const skipKey = node.props?.skipRenderWhenFormExtraTruthy as string | undefined;
    if (skipKey && ctx.formExtras?.[skipKey]) {
        return null;
    }

    const skipUnlessKey = node.props?.skipRenderWhenFormExtraNotTruthy as string | undefined;
    if (skipUnlessKey && !ctx.formExtras?.[skipUnlessKey]) {
        return null;
    }

    if (ctx.mode === "sheet" && ctx.access) {
        if (node.permissions?.readAny?.length) {
            if (!node.permissions.readAny.some((k) => hasAccessPath(ctx.access, k))) return null;
        } else if (node.permissions?.read && !hasAccessPath(ctx.access, node.permissions.read)) {
            return null;
        }
    }

    if (ctx.data) {
        if (node.dependentAny?.length) {
            const anyPresent = node.dependentAny.some((dep) => {
                const value = resolvePath(ctx.data!, dep);
                return !dependentValueEffectivelyAbsent(value);
            });
            if (!anyPresent) return null;
        } else if (node.dependent) {
            const value = resolvePath(ctx.data, node.dependent);
            if (dependentValueEffectivelyAbsent(value)) return null;
        }
    }

    const perms = node.permissions;
    if (perms?.writeAny?.length && ctx.writeAccess) {
        if (!perms.writeAny.some((k) => ctx.writeAccess![k])) return null;
    } else if (perms?.write && ctx.writeAccess) {
        if (!ctx.writeAccess[perms.write]) return null;
    }

    if (node.field && ctx.mode === "form" && ctx.renderField) {
        return ctx.renderField(node, node.field, index);
    }

    if (node.field && ctx.mode === "sheet") {
        return renderSheetField(node, node.field, ctx, index);
    }

    const token = node.render;
    const isRegistered = token.startsWith("#");

    if (isRegistered) {
        const Component = resolveWidget(token);
        if (!Component) {
            console.warn(`[ViewRenderer] Unknown widget token: ${token}`);
            return null;
        }
        return renderRegisteredComponent(Component, node, ctx, index);
    }

    const children = node.children ? renderNodes(node.children, ctx) : undefined;
    const { skipRenderWhenFormExtraTruthy: _s1, skipRenderWhenFormExtraNotTruthy: _s2, ...domProps } = node.props ?? {};
    return createElement(token, { key: index, ...domProps }, children);
}

const COMPONENTS_NEEDING_LANGUAGE = new Set(["#TitleWithCollapse", "#SheetGroup"]);

function renderRegisteredComponent(
    Component: React.ComponentType<any>,
    node: ViewNode,
    ctx: ViewRendererContext,
    index: number
): ReactNode {
    const { props: nodeProps, children: nodeChildren, render: token } = node;
    const resolvedProps: Record<string, any> = { ...nodeProps, key: index };

    if (token === "#FormAlert") {
        const rawMessage = resolvedProps.message;
        if (typeof rawMessage === "string" && rawMessage && ctx.resolveLanguageKey) {
            resolvedProps.message = ctx.resolveLanguageKey(rawMessage);
        }
    } else if (COMPONENTS_NEEDING_LANGUAGE.has(token)) {
        const rawTitle = resolvedProps.title;
        if (token === "#SheetGroup") {
            // Persist collapse against the raw language key (stable across locales),
            // optionally namespaced by sheet model. Explicit `collapseKey` wins.
            const explicitKey =
                typeof resolvedProps.collapseKey === "string" && resolvedProps.collapseKey.length > 0
                    ? resolvedProps.collapseKey
                    : typeof resolvedProps.collapseStorageKey === "string" &&
                        resolvedProps.collapseStorageKey.length > 0
                      ? resolvedProps.collapseStorageKey
                      : null;
            const titleKey = typeof rawTitle === "string" && rawTitle.length > 0 ? rawTitle : null;
            const derived =
                explicitKey ??
                (titleKey
                    ? ctx.sheetModel
                        ? `${ctx.sheetModel}:${titleKey}`
                        : titleKey
                    : null);
            if (derived) {
                resolvedProps.collapseStorageKey = derived;
            }
            delete resolvedProps.collapseKey;
        }
        if (rawTitle && ctx.resolveLanguageKey) {
            resolvedProps.title = ctx.resolveLanguageKey(rawTitle);
        }
    }

    if (token === "#SheetGroup") {
        const iconToken = resolvedProps.titleIcon;
        if (typeof iconToken === "string" && iconToken.length > 0) {
            const Icon = resolveIcon(iconToken);
            const iconClass =
                typeof resolvedProps.titleIconClassName === "string" ? resolvedProps.titleIconClassName : "";
            if (Icon) {
                resolvedProps.titleIcon = createElement(Icon, {
                    className: cn("size-5 shrink-0", iconClass),
                });
            } else {
                delete resolvedProps.titleIcon;
            }
            delete resolvedProps.titleIconClassName;
        }
        const actionsToken = resolvedProps.titleActions;
        if (typeof actionsToken === "string" && actionsToken.startsWith("#")) {
            const ActionsComp = resolveWidget(actionsToken);
            if (ActionsComp) {
                const passSheetLang = actionsToken === "#ReferencesViewModeToggle";
                resolvedProps.titleActions = createElement(ActionsComp, {
                    key: "sheet-group-title-actions",
                    ...(passSheetLang && ctx.resolveLanguageKey
                        ? { sheetLanguageKey: ctx.resolveLanguageKey }
                        : {}),
                });
            } else {
                delete resolvedProps.titleActions;
            }
        }
    }

    const children = nodeChildren ? renderNodes(nodeChildren, ctx) : undefined;
    return createElement(Component, resolvedProps, children);
}

// ---------------------------------------------------------------------------
// Sheet-mode field rendering
// ---------------------------------------------------------------------------

/**
 * `linkedObjectRefCardList` container layouts. Class names must appear as string literals in this file
 * so Tailwind can emit them; `widgetProps.listClassName` from maestro/API JSON is not scanned and those
 * utilities are stripped from CSS.
 */
const LINKED_OBJECT_REF_LIST_LAYOUT = {
    /** 1 col → 2 (md) → 3 (lg) → 4 (xl). */
    responsive4: "grid w-full min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2",
    /** Fixed 4 columns. */
    grid4: "grid w-full min-w-0 grid-cols-4 gap-2",
} as const;

/** Optional `field.widgetProps.className` wraps tenancy reference cards (e.g. `min-w-0` in grids). */
function wrapTenancyFieldCard(
    index: number,
    widgetProps: Record<string, any>,
    card: ReactNode
): ReactNode {
    const wrapperClass = typeof widgetProps.className === "string" ? widgetProps.className : "";
    if (wrapperClass) {
        return <div key={index} className={wrapperClass}>{card}</div>;
    }
    if (isValidElement(card)) {
        return cloneElement(card, { key: index });
    }
    return card;
}

function renderSheetField(
    node: ViewNode,
    binding: FieldBinding,
    ctx: ViewRendererContext,
    index: number
): ReactNode {
    const { data } = ctx;
    const wp = binding.widgetProps ?? {};

    const contributed = getSheetFieldRenderer(binding.widget);
    if (contributed) {
        const result = contributed({
            node,
            binding,
            ctx,
            index,
            Component: resolveWidget(binding.widget),
        });
        if (result !== undefined) {
            return result;
        }
    }

    if (binding.widget === "#TenancyCountryCard") {
        const show = !(node.permissions?.read && !hasAccessPath(ctx.access, node.permissions.read));
        if (!show || !data) return null;
        const raw = resolvePath(data, binding.name);
        const normalized = normalizeObjectIdRef<Country>(raw);
        if (!normalized || typeof normalized.stub._id !== "string") return null;
        const c = normalized.stub;
        const { className: _w, ...cardWp } = wp;
        return wrapTenancyFieldCard(
            index,
            wp,
            <Suspense fallback={null}>
                <TenancyCountryCardLazy
                    {...cardWp}
                    country={c}
                    fetchId={normalized.fetchId}
                    hideActions={true}
                />
            </Suspense>
        );
    }

    if (binding.widget === "#TenancyStateCard") {
        const show = !(node.permissions?.read && !hasAccessPath(ctx.access, node.permissions.read));
        if (!show || !data) return null;
        const raw = resolvePath(data, binding.name);
        const normalized = normalizeObjectIdRef<State>(raw);
        if (!normalized || typeof normalized.stub._id !== "string") return null;
        const s = normalized.stub;
        const { className: _w, ...cardWp } = wp;
        return wrapTenancyFieldCard(
            index,
            wp,
            <Suspense fallback={null}>
                <TenancyStateCardLazy
                    {...cardWp}
                    state={s}
                    fetchId={normalized.fetchId}
                    hideActions={true}
                />
            </Suspense>
        );
    }

    if (binding.widget === "#TenancyCityCard") {
        const show = !(node.permissions?.read && !hasAccessPath(ctx.access, node.permissions.read));
        if (!show || !data) return null;
        const raw = resolvePath(data, binding.name);
        const normalized = normalizeObjectIdRef<City>(raw);
        if (!normalized || typeof normalized.stub._id !== "string") return null;
        const city = normalized.stub;
        const { className: _w, ...cardWp } = wp;
        return wrapTenancyFieldCard(
            index,
            wp,
            <Suspense fallback={null}>
                <TenancyCityCardLazy
                    {...cardWp}
                    city={city}
                    fetchId={normalized.fetchId}
                    hideActions={true}
                />
            </Suspense>
        );
    }

    if (binding.widget === "#TenancyCurrencyCard") {
        const show = !(node.permissions?.read && !hasAccessPath(ctx.access, node.permissions.read));
        if (!show || !data) return null;
        const raw = resolvePath(data, binding.name);
        const normalized = normalizeObjectIdRef<Currency>(raw);
        if (!normalized || typeof normalized.stub._id !== "string") return null;
        const { className: _w, ...cardWp } = wp;
        return wrapTenancyFieldCard(
            index,
            wp,
            <Suspense fallback={null}>
                <TenancyCurrencyCardLazy
                    {...cardWp}
                    currency={normalized.stub}
                    fetchId={normalized.fetchId}
                    hideActions={true}
                />
            </Suspense>
        );
    }

    if (binding.widget === "#SheetCompanyAddresses") {
        const show = !(node.permissions?.read && !hasAccessPath(ctx.access, node.permissions.read));
        if (!show || !data) return null;
        const addresses = resolvePath(data, binding.name);
        const badgeAccessModel =
            typeof wp.badgeAccessModel === "string" && wp.badgeAccessModel.length > 0
                ? wp.badgeAccessModel
                : undefined;
        return createElement(SheetCompanyAddressesSection, {
            key: index,
            addresses,
            resolveLanguageKey: ctx.resolveLanguageKey,
            show,
            badgeAccessModel,
        });
    }

    if (binding.widget === "#SheetAddressSection") {
        const show = !(node.permissions?.read && !hasAccessPath(ctx.access, node.permissions.read));
        if (!show || !data) return null;
        const address = resolvePath(data, binding.name);
        const badgeAccessModel =
            typeof wp.badgeAccessModel === "string" && wp.badgeAccessModel.length > 0
                ? wp.badgeAccessModel
                : undefined;
        return createElement(SheetAddressSection, {
            key: index,
            address,
            resolveLanguageKey: ctx.resolveLanguageKey,
            show,
            badgeAccessModel,
        });
    }

    if (binding.widget === "#ReferencesRender") {
        return createElement(ReferencesRenderHost, { node, binding, ctx, index });
    }

    const Component = resolveWidget(binding.widget);
    if (!Component) return null;

    if (binding.widget === "#DisplayCard") {
        return renderDisplayCard(Component, node, binding, ctx, index);
    }

    if (binding.widget === "#ExpandableText") {
        let value: unknown = data ? resolvePath(data, binding.name) : null;
        if (wp.valueType === "faqBlock" && Array.isArray(value) && value.length > 0) {
            value = (value as {question?: string; answer?: string}[])
                .map((f) => {
                    const q = String(f.question ?? "").trim();
                    const a = String(f.answer ?? "").trim();
                    if (!q && !a) return "";
                    return `${q ? `Q: ${q}` : ""}${q && a ? "\n" : ""}${a ? `A: ${a}` : ""}`;
                })
                .filter((s) => s.length > 0)
                .join("\n\n");
            if (value === "") value = null;
        } else if (Array.isArray(value) && value.length > 0 && value.every((x) => typeof x === "string")) {
            value = (value as string[]).map((line) => `• ${line}`).join("\n");
        } else if (wp.format === "json" && value != null && typeof value === "object") {
            try {
                value = JSON.stringify(value, null, 2);
            } catch {
                value = null;
            }
        }
        const show = !(node.permissions?.read && !hasAccessPath(ctx.access, node.permissions.read));
        const {valueType: _expandableValueType, format: _expandableFormat, ...expandableWp} = wp;
        void _expandableValueType;
        void _expandableFormat;
        return createElement(
            Component,
            {
                ...expandableWp,
                key: index,
                show,
            },
            value as ReactNode,
        );
    }

    if (binding.widget === "#SheetMediaFilesStrip") {
        if (!data) return null;
        const combine = Array.isArray(wp.combineFromFields) ? (wp.combineFromFields as unknown[]).filter((p): p is string => typeof p === "string" && p.length > 0) : [];
        const mediaList: unknown[] = [];
        if (combine.length > 0) {
            const seen = new Set<string>();
            for (const path of combine) {

                if (ctx.access && !hasAccessPath(ctx.access, path)) continue;
                const v = resolvePath(data, path);
                const pushOne = (item: unknown) => {
                    if (item == null) return;
                    if (typeof item === "string" && item.length > 0) {
                        if (seen.has(item)) return;
                        seen.add(item);
                        mediaList.push({ _id: item });
                        return;
                    }
                    if (typeof item !== "object") return;
                    const id = (item as { _id?: unknown })._id;
                    if (typeof id !== "string" || seen.has(id)) return;
                    seen.add(id);
                    mediaList.push(item);
                };
                if (Array.isArray(v)) {
                    for (const item of v) pushOne(item);
                } else {
                    pushOne(v);
                }
            }
        } else {
            if (ctx.access && !hasAccessPath(ctx.access, binding.name)) return null;
            const raw = resolvePath(data, binding.name);
            if (Array.isArray(raw)) {
                for (const item of raw) {
                    if (item != null && typeof item === "object") mediaList.push(item);
                }
            } else if (raw != null && typeof raw === "object") {
                mediaList.push(raw);
            } else if (typeof raw === "string" && raw.length > 0) {
                mediaList.push({ _id: raw });
            }
        }
        const stripLabel =
            typeof binding.label === "string" && binding.label.length > 0
                ? String(ctx.resolveLanguageKey(binding.label))
                : null;
        const stripIcon = typeof wp.icon === "string" ? wp.icon : null;
        if (mediaList.length === 0) {
            return wrapSheetMediaWithLabel(stripLabel, <ValueNotSet />, index, stripIcon);
        }
        return wrapSheetMediaWithLabel(
            stripLabel,
            createElement(Component, {
                media: mediaList,
                resolveLanguageKey: ctx.resolveLanguageKey,
                className: typeof wp.className === "string" ? wp.className : undefined,
                canDownload: wp.canDownload !== false,
                canRemove: wp.canRemove === true,
                isBig: wp.isBig === true,
            }),
            index,
            stripIcon,
        );
    }

    if (binding.widget === "#SheetMediaAvatar") {
        if (!data) return null;
        if (ctx.access && !hasAccessPath(ctx.access, binding.name)) return null;
        const raw = resolvePath(data, binding.name);
        let mediaId: string | null = null;
        if (typeof raw === "string" && raw.length > 0) {
            mediaId = raw;
        } else if (raw != null && typeof raw === "object" && (raw as { _id?: unknown })._id != null) {
            const id = (raw as { _id: unknown })._id;
            mediaId = typeof id === "string" ? id : String(id);
        }
        if (!mediaId) return <ValueNotSet />;
        const nameField = typeof wp.nameField === "string" && wp.nameField.length > 0 ? wp.nameField : "name";
        const nameVal = resolvePath(data, nameField);
        const nameStr = typeof nameVal === "string" ? nameVal : "";
        return createElement(Component, {
            key: index,
            mediaId,
            name: nameStr,
            className: typeof wp.className === "string" ? wp.className : undefined,
            imageClassName: typeof wp.imageClassName === "string" ? wp.imageClassName : undefined,
        });
    }

    if (binding.widget === "#GalleryCarousel") {
        let mainImage = data ? resolvePath(data, binding.name) : null;
        let imageGallery: unknown[] = [];
        if (typeof wp.imageGalleryField === "string" && wp.imageGalleryField.length > 0 && data) {
            const g = resolvePath(data, wp.imageGalleryField);
            imageGallery = Array.isArray(g) ? g : [];
        }
        if (Array.isArray(mainImage)) {
            if (imageGallery.length === 0) imageGallery = mainImage;
            mainImage = null;
        }
        let videoGallery: unknown[] = [];
        if (data && typeof wp.videoGalleryField === "string" && wp.videoGalleryField.length > 0) {
            const v = resolvePath(data, wp.videoGalleryField);
            videoGallery = Array.isArray(v) ? v : [];
        }

        const hasAccess = !ctx.access || (
            ctx.access[binding.name] ||
            (wp.imageGalleryField && ctx.access[wp.imageGalleryField]) ||
            (wp.videoGalleryField && ctx.access[wp.videoGalleryField])
        );
        if (!hasAccess) return null;

        const galleryLabel =
            typeof binding.label === "string" && binding.label.length > 0
                ? String(ctx.resolveLanguageKey(binding.label))
                : null;
        const galleryIcon = typeof wp.icon === "string" ? wp.icon : null;
        const hasMedia =
            (mainImage != null &&
                (typeof mainImage === "string"
                    ? mainImage.length > 0
                    : typeof mainImage === "object")) ||
            imageGallery.length > 0 ||
            videoGallery.length > 0;
        if (!hasMedia) {
            return wrapSheetMediaWithLabel(galleryLabel, <ValueNotSet />, index, galleryIcon);
        }

        const {icon: _galleryIconProp, ...galleryWp} = wp;
        void _galleryIconProp;
        return wrapSheetMediaWithLabel(
            galleryLabel,
            createElement(Component, {
                ...galleryWp,
                mainImage,
                imageGallery,
                videoGallery,
            }),
            index,
            galleryIcon,
        );
    }

    if (binding.widget === "#SheetLocationMap") {
        const show = !(node.permissions?.read && !hasAccessPath(ctx.access, node.permissions.read));
        if (!show) return null;
        const addressField = wp.addressField ?? "address";
        // "." = entity itself is the address (flat lat/lng on the document, e.g. customerAddress)
        const address = !data ? null : addressField === "." ? data : resolvePath(data, addressField);
        if (!address) {
            return null;
        }
        return createElement(Component, {
            ...wp,
            key: index,
            address,
        });
    }

    if (binding.widget === "#SheetEmbeddedItemsList") {
        return createElement(SheetEmbeddedItemsListHost, { node, binding, ctx, index });
    }

    return createElement(Component, { ...wp, key: index });
}

/** Optional title (+ icon) above gallery / media strip so empty state is not a bare ValueNotSet. */
function wrapSheetMediaWithLabel(
    label: string | null,
    content: ReactNode,
    key: number,
    iconToken?: string | null,
): ReactNode {
    if (!label) {
        return createElement("div", {key}, content);
    }
    const Icon = typeof iconToken === "string" && iconToken.length > 0 ? resolveIcon(iconToken) : null;
    const heading = createElement(
        "div",
        {className: "flex items-center gap-2"},
        Icon
            ? createElement(
                  "div",
                  {className: "shrink-0 rounded-md bg-background p-2"},
                  createElement(Icon, {className: "h-4 w-4 text-muted-foreground"}),
              )
            : null,
        createElement("p", {className: "text-sm font-medium text-muted-foreground"}, label),
    );
    return createElement("div", {key, className: "flex flex-col gap-1.5"}, heading, content);
}

function formatSheetSmallInfoTemporal(value: unknown, mode: "date" | "dateTime"): string | null {
    if (value == null || value === "") return null;
    const d =
        value instanceof Date
            ? value
            : typeof value === "string" || typeof value === "number"
              ? new Date(value)
              : null;
    if (!d || !isValid(d)) return String(value);
    return format(d, mode === "dateTime" ? "PPp" : "PP");
}

/**
 * Partial row `{ _id, [field]: string }` for linked sheet `data` while `/single` loads.
 * Uses the same `displayValue` as the DisplayCard label; skips React nodes / structured values.
 */
function bootstrapLinkedSheetDataFromDisplayValue(
    linkedId: string,
    displayValue: unknown,
    valueFieldName: string | undefined
): Record<string, unknown> {
    const field =
        typeof valueFieldName === "string" && valueFieldName.length > 0 ? valueFieldName : "name";
    const base: Record<string, unknown> = { _id: linkedId };
    if (displayValue == null || isValidElement(displayValue)) {
        return base;
    }
    if (typeof displayValue === "string" || typeof displayValue === "number" || typeof displayValue === "boolean") {
        base[field] = String(displayValue);
        return base;
    }
    return base;
}

/** Prefer a populated ref document for the linked sheet; avoid using the card's display string as `name` (e.g. price + symbol). */
function bootstrapLinkedSmallInfoSheetData(
    linkedId: string,
    rawRefAtPath: unknown,
    displayValue: unknown,
    valueFieldName: string | undefined,
): Record<string, unknown> {
    const normalized = normalizeObjectIdRef(rawRefAtPath);
    const stub = normalized?.stub;
    if (stub && typeof stub === "object" && !Array.isArray(stub) && Object.keys(stub as object).length > 1) {
        return { ...(stub as Record<string, unknown>) };
    }
    return bootstrapLinkedSheetDataFromDisplayValue(linkedId, displayValue, valueFieldName);
}

type LinkedSheetTarget = {
    model: string;
    widgetToken: string;
    entityProp: string;
    valueField: string | undefined;
};

/**
 * Resolves a nested sheet target from either static `linkedSheetModel` / `linkedSheetWidget`
 * or polymorphic `linkedSheetByType` + `linkedSheetTypePath` (discriminator on `data`).
 *
 * Example:
 * ```
 * linkedRefPath: "sourceId",
 * linkedSheetTypePath: "sourceType",
 * linkedSheetByType: {
 *   productOrder: {
 *     linkedSheetModel: "productOrders",
 *     linkedSheetWidget: "#ProductOrderSheetView",
 *     linkedSheetEntityProp: "order",
 *   },
 * }
 * ```
 * Types missing from the map (e.g. `checkout` with no panel sheet) simply do not link.
 */
function resolveLinkedSheetTarget(
    wp: Record<string, any>,
    data: Record<string, any> | undefined,
): LinkedSheetTarget | null {
    const byType = wp.linkedSheetByType;
    if (byType != null && typeof byType === "object" && !Array.isArray(byType)) {
        if (!data) return null;
        const typePath =
            typeof wp.linkedSheetTypePath === "string" && wp.linkedSheetTypePath.length > 0
                ? wp.linkedSheetTypePath
                : "sourceType";
        const typeVal = resolvePath(data, typePath);
        if (typeof typeVal !== "string" || typeVal.length === 0) return null;
        const entry = (byType as Record<string, unknown>)[typeVal];
        if (entry == null || typeof entry !== "object" || Array.isArray(entry)) return null;
        const e = entry as Record<string, unknown>;
        const model = typeof e.linkedSheetModel === "string" ? e.linkedSheetModel : "";
        const widgetToken =
            typeof e.linkedSheetWidget === "string" && e.linkedSheetWidget.startsWith("#")
                ? e.linkedSheetWidget
                : "";
        if (!model || !widgetToken) return null;
        return {
            model,
            widgetToken,
            entityProp:
                typeof e.linkedSheetEntityProp === "string" && e.linkedSheetEntityProp.length > 0
                    ? e.linkedSheetEntityProp
                    : "project",
            valueField:
                typeof e.linkedSheetValueField === "string" ? e.linkedSheetValueField : undefined,
        };
    }

    const model = typeof wp.linkedSheetModel === "string" ? wp.linkedSheetModel : "";
    const widgetToken =
        typeof wp.linkedSheetWidget === "string" && wp.linkedSheetWidget.startsWith("#")
            ? wp.linkedSheetWidget
            : "";
    if (!model || !widgetToken) return null;
    return {
        model,
        widgetToken,
        entityProp:
            typeof wp.linkedSheetEntityProp === "string" && wp.linkedSheetEntityProp.length > 0
                ? wp.linkedSheetEntityProp
                : "project",
        valueField:
            typeof wp.linkedSheetValueField === "string" ? wp.linkedSheetValueField : undefined,
    };
}

/**
 * Renders each array element as a `#DisplayCard` row with the same linked-sheet wiring as a single
 * `linkedRefPath` card (`linkedSheetModel`, `linkedSheetWidget`, optional `linkedSheetEntityProp` / `linkedSheetValueField`).
 * Deletes from the nested sheet invoke `unlinkEmbeddedListRefItem(listPath, index)` (defaults `listPath` to `field.name`).
 */
function renderLinkedObjectRefCardList(
    Component: React.ComponentType<any>,
    node: ViewNode,
    binding: FieldBinding,
    ctx: ViewRendererContext,
    index: number,
): ReactNode {
    const { data, resolveLanguageKey } = ctx;
    const wp = binding.widgetProps ?? {};
    const linkedModel = typeof wp.linkedSheetModel === "string" ? wp.linkedSheetModel : "";
    const linkedSheetToken =
        typeof wp.linkedSheetWidget === "string" && wp.linkedSheetWidget.startsWith("#")
            ? wp.linkedSheetWidget
            : "";
    const LinkedSheetWidget = linkedSheetToken ? resolveWidget(linkedSheetToken) : null;
    const listPath =
        typeof wp.linkedRefListPath === "string" && wp.linkedRefListPath.length > 0
            ? wp.linkedRefListPath
            : binding.name;
    const labelField = typeof wp.labelField === "string" ? wp.labelField : "name";

    const Icon = wp.icon ? resolveIcon(wp.icon) : undefined;
    const baseLabel = binding.label ? String(resolveLanguageKey(binding.label)) : binding.name;
    const show = !(node.permissions?.read && !hasAccessPath(ctx.access, node.permissions?.read));

    if (!linkedModel || !LinkedSheetWidget) {
        console.warn(
            "[ViewRenderer] linkedObjectRefCardList requires linkedSheetModel and linkedSheetWidget",
        );
        return null;
    }

    if (!data) {
        return createElement(Component, {
            key: index,
            title: baseLabel,
            tooltip: wp.tooltip ? String(resolveLanguageKey(wp.tooltip)) : baseLabel,
            show,
            Icon: Icon ?? undefined,
            value: null,
            variant: wp.variant,
            dontRenderValue: false,
        });
    }

    const rawList = resolvePath(data, binding.name);
    if (!Array.isArray(rawList) || rawList.length === 0) {
        return createElement(Component, {
            key: index,
            title: baseLabel,
            tooltip: wp.tooltip ? String(resolveLanguageKey(wp.tooltip)) : baseLabel,
            show,
            Icon: Icon ?? undefined,
            value: null,
            variant: wp.variant,
            dontRenderValue: false,
        });
    }

    const layoutKey =
        typeof wp.linkedRefListLayout === "string" && wp.linkedRefListLayout.length > 0
            ? wp.linkedRefListLayout
            : "";
    const fromPreset =
        layoutKey in LINKED_OBJECT_REF_LIST_LAYOUT
            ? LINKED_OBJECT_REF_LIST_LAYOUT[layoutKey as keyof typeof LINKED_OBJECT_REF_LIST_LAYOUT]
            : null;

    const listClass =
        fromPreset ??
        (typeof wp.listClassName === "string" && wp.listClassName.length > 0
            ? wp.listClassName
            : "flex flex-col gap-2");

    const cards: ReactNode[] = [];
    rawList.forEach((rawItem: unknown, rowIndex: number) => {
        const normalized = normalizeObjectIdRef(rawItem);
        if (!normalized) {
            return;
        }
        const stub = normalized.stub as Record<string, any>;
        const id = typeof stub._id === "string" ? stub._id : undefined;
        if (!id) {
            return;
        }
        const label =
            labelField.includes(".") ? resolvePath(stub, labelField) : stub?.[labelField];
        const displayTitle =
            label != null && label !== ""
                ? String(label)
                : typeof stub?.name === "string"
                  ? stub.name
                  : id;

        const bootstrap =
            stub && typeof stub === "object" && !Array.isArray(stub) && Object.keys(stub as object).length > 1
                ? {...(stub as Record<string, unknown>)}
                : bootstrapLinkedSheetDataFromDisplayValue(
                      id,
                      displayTitle,
                      typeof wp.linkedSheetValueField === "string" ? wp.linkedSheetValueField : undefined,
                  );
        const entityProp =
            typeof wp.linkedSheetEntityProp === "string" && wp.linkedSheetEntityProp.length > 0
                ? wp.linkedSheetEntityProp
                : "project";

        const BoundLinkedSheet: ComponentType<DisplayCardLinkedSheetOuterProps> = (sheetProps) => {
            const { onLinkedDeleted, ...rest } = sheetProps;
            const refCtx = ctx.referenceCardUnitContext;
            const sheetPropsOut: Record<string, unknown> = {
                ...rest,
                fetchId: id,
                onDelete: (..._args: unknown[]) => {
                    ctx.unlinkEmbeddedListRefItem?.(listPath, rowIndex);
                    onLinkedDeleted?.();
                },
            };
            if (refCtx?.unitId) {
                sheetPropsOut.unitId = refCtx.unitId;
            }
            if (refCtx?.unitName !== undefined) {
                sheetPropsOut.unitName = refCtx.unitName;
            }
            sheetPropsOut[entityProp] = bootstrap;
            return createElement(LinkedSheetWidget as ComponentType<any>, sheetPropsOut);
        };

        cards.push(
            createElement(Component, {
                key: `${id}-${rowIndex}`,
                title: displayTitle,
                tooltip: wp.tooltip ? String(resolveLanguageKey(wp.tooltip)) : displayTitle,
                show,
                Icon: Icon ?? undefined,
                value: null,
                variant: wp.variant,
                dontRenderValue: true,
                linkedReferenceSheet: {
                    resourceId: linkedModel,
                    LinkedSheet: BoundLinkedSheet,
                },
            }),
        );
    });

    if (cards.length === 0) {
        return createElement(Component, {
            key: index,
            title: baseLabel,
            tooltip: wp.tooltip ? String(resolveLanguageKey(wp.tooltip)) : baseLabel,
            show,
            Icon: Icon ?? undefined,
            value: null,
            variant: wp.variant,
            dontRenderValue: false,
        });
    }

    return <div className={cn(listClass)}>{cards}</div>;
}

function renderDisplayCard(
    Component: React.ComponentType<any>,
    node: ViewNode,
    binding: FieldBinding,
    ctx: ViewRendererContext,
    index: number
): ReactNode {
    const { data, resolveLanguageKey } = ctx;
    const wp = binding.widgetProps ?? {};
    const displayType = typeof wp.type === "string" && wp.type.length > 0 ? wp.type : undefined;
    const bodyWidget = typeof wp.bodyWidget === "string" && wp.bodyWidget.length > 0 ? wp.bodyWidget : undefined;
    const skipPreFormat = !!displayType || !!bodyWidget;
    let typeForCard = displayType;

    if (wp.valueType === "linkedObjectRefCardList") {
        return renderLinkedObjectRefCardList(Component, node, binding, ctx, index);
    }

    let displayValue: any;

    if (wp.valueType === "currencyList") {
        displayValue = renderCurrencyList(data, binding.name, wp, resolveLanguageKey);
    } else if (wp.valueType === "stringBadgeList") {
        displayValue = renderStringBadgeList(data, binding.name, wp.maxItems);
    } else if (wp.valueType === "objectNameBadgeList") {
        displayValue = renderObjectNameBadgeList(data, binding.name, wp.labelField ?? "name");
    } else if (wp.valueType === "unitTypeBadgeList") {
        displayValue = renderUnitTypeBadgeList(
            data,
            binding.name,
            ctx.access,
            node.permissions?.read
        );
    } else if (wp.valueType === "mdiIcon" && data && !skipPreFormat) {
        const raw = resolvePath(data, binding.name);
        if (raw == null || raw === "") {
            displayValue = null;
        } else {
            displayValue = <MdiIcon icon={String(raw)} size={0.7} showFallback />;
        }
    } else if (wp.valuePath && Array.isArray(wp.valuePath) && data) {
        const parent = wp.parent ? resolvePath(data, wp.parent) : data;
        if (!parent) return null;
        const rawValuePath = (wp.valuePath as unknown[]).filter(
            (p): p is string => typeof p === "string" && p.length > 0,
        );
        const valuePath =
            typeof wp.parent === "string" && wp.parent.length > 0
                ? filterAccessibleValuePath(ctx.access, wp.parent, rawValuePath)
                : rawValuePath;
        if (valuePath.length > 0) {
            // Currency cards: pass {amount, currency} — do not join into "€ 123" (DisplayValue rejects that).
            if (displayType === "currency" && !wp.pickFirstTruthyValuePath) {
                displayValue = currencyStubFromValuePath(parent as Record<string, unknown>, valuePath);
            } else {
                let pathParts = valuePath.map((p: string) => resolvePath(parent, p));
                const categoriesByPath = wp.languageKeyCategoriesByPath as Record<string, string> | undefined;
                if (categoriesByPath && typeof categoriesByPath === "object") {
                    pathParts = pathParts.map((part, i) => {
                        const segment = String(valuePath[i] ?? "");
                        const category =
                            categoriesByPath[segment] ?? categoriesByPath[segment.split(".")[0] ?? ""];
                        if (category && part != null && typeof part === "string" && part.length > 0) {
                            return resolveLanguageKey(`${category}.${part}`);
                        }
                        return part;
                    });
                }
                if (wp.format === "locale") {
                    pathParts = pathParts.map((part: unknown) =>
                        part != null && typeof part === "number" ? part.toLocaleString() : part
                    );
                }
                if (wp.pickFirstTruthyValuePath) {
                    displayValue = pathParts.find((part) => part != null && part !== "") ?? null;
                } else {
                    const parts = pathParts.filter(
                        (part) => part !== null && part !== undefined && part !== ""
                    );
                    displayValue = parts.join(wp.joinSeparator ?? " ");
                }
            }
        } else {
            displayValue = null;
        }
    } else if (data) {
        displayValue = resolvePath(data, binding.name);
    }

    if (bodyWidget) {
        const renderer = getSheetFieldRenderer(bodyWidget);
        if (renderer) {
            displayValue = renderer({
                node,
                binding,
                ctx,
                index,
                Component: resolveWidget(bodyWidget),
            });
        }
    }

    if (!skipPreFormat && wp.format === "locale" && displayValue != null && typeof displayValue === "number") {
        displayValue = displayValue.toLocaleString();
    }

    if (!skipPreFormat && displayValue != null && (wp.format === "date" || wp.format === "dateTime")) {
        displayValue = formatSheetSmallInfoTemporal(displayValue, wp.format === "dateTime" ? "dateTime" : "date");
    }

    if (
        displayType !== "enum" &&
        typeof wp.languageKeyCategory === "string" &&
        wp.languageKeyCategory.length > 0 &&
        displayValue != null
    ) {
        if (typeof displayValue === "string" && displayValue.length > 0) {
            displayValue = resolveLanguageKey(`${wp.languageKeyCategory}.${displayValue}`);
        } else if (typeof displayValue === "boolean") {
            displayValue = resolveLanguageKey(`${wp.languageKeyCategory}.${displayValue ? "true" : "false"}`);
        }
    }

    if (!skipPreFormat && wp.valueType === "boolean" && displayValue != null && !isValidElement(displayValue)) {
        if (typeof displayValue === "boolean") {
            displayValue = resolveLanguageKey(displayValue ? "yes" : "no");
        } else if (displayValue === "true" || displayValue === "false") {
            displayValue = resolveLanguageKey(displayValue === "true" ? "yes" : "no");
        }
    }

    if (
        !skipPreFormat &&
        wp.prefix &&
        displayValue != null &&
        !isValidElement(displayValue) &&
        (typeof displayValue === "string" || typeof displayValue === "number")
    ) {
        const str = String(displayValue);
        if (!str.includes(wp.prefix)) displayValue = wp.prefix + str;
    }
    if (
        !skipPreFormat &&
        wp.suffix &&
        displayValue != null &&
        !isValidElement(displayValue) &&
        (typeof displayValue === "string" || typeof displayValue === "number")
    ) {
        const str = String(displayValue);
        if (!str.includes(wp.suffix)) displayValue = str + wp.suffix;
    }

    // Currency stubs skip the string prefix/suffix path above; bake them in as plain text.
    if (
        displayType === "currency" &&
        displayValue != null &&
        typeof displayValue === "object" &&
        !isValidElement(displayValue) &&
        !Array.isArray(displayValue) &&
        (wp.prefix || wp.suffix)
    ) {
        const stub = displayValue as {
            amount?: unknown;
            currency?: {symbol?: string; abbreviation?: string};
            symbol?: string;
            abbreviation?: string;
        };
        const amount =
            typeof stub.amount === "number" && Number.isFinite(stub.amount) ? stub.amount : null;
        if (amount != null) {
            const label =
                stub.currency?.symbol?.trim() ||
                stub.currency?.abbreviation?.trim() ||
                stub.symbol?.trim() ||
                stub.abbreviation?.trim() ||
                "";
            const formatted = amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
            let str = label ? `${label} ${formatted}` : formatted;
            if (wp.prefix && !str.includes(wp.prefix)) str = wp.prefix + str;
            if (wp.suffix && !str.includes(wp.suffix)) str = str + wp.suffix;
            displayValue = str;
            typeForCard = undefined;
        }
    }

    const Icon = wp.icon ? resolveIcon(wp.icon) : undefined;
    const label = binding.label ? String(resolveLanguageKey(binding.label)) : binding.name;
    const tooltipText = wp.tooltip ? String(resolveLanguageKey(wp.tooltip)) : label;

    /*
     * `avatarPath` points at a media ref on the entity (`createdBy.photo`) and swaps the icon
     * for that photo; `flagCodePath` does the same with a country ref's ISO code.
     *
     * Both media slots are gated on the account's read access for the path they read, the same
     * `hasAccessPath` the value itself goes through. The server already strips an unreadable
     * path from the payload, so this is the second of the two checks the engine runs
     * everywhere — and it is the one the Studio's access simulator can narrow, which is what
     * makes a revoked `country.code` fall back to the icon there as it would live.
     *
     * Falling back rather than hiding: a card with no media renders its `icon`, so a reader
     * without the flag or the photo still gets a labelled card.
     */
    const flagCodePath = typeof wp.flagCodePath === "string" ? wp.flagCodePath : "";
    const flagCode =
        flagCodePath && data && hasAccessPath(ctx.access, flagCodePath)
            ? String(resolvePath(data, flagCodePath) ?? "").trim() || undefined
            : undefined;

    const avatarPath = typeof wp.avatarPath === "string" ? wp.avatarPath : "";
    let avatar: {mediaId: string; name: string} | undefined;
    if (avatarPath && data && hasAccessPath(ctx.access, avatarPath)) {
        const mediaId = normalizeObjectIdRef(resolvePath(data, avatarPath))?.fetchId;
        if (mediaId) {
            avatar = {
                mediaId,
                name: typeof displayValue === "string" ? displayValue : label,
            };
        }
    }

    const cardColorVariants = new Set(["default", "success", "destructive", "warning", "info"]);
    let variant = typeof wp.variant === "string" && cardColorVariants.has(wp.variant) ? wp.variant : undefined;
    if (wp.variantLookupField && wp.variantLookupMap != null && typeof wp.variantLookupMap === "object" && data) {
        const lk = resolvePath(data, wp.variantLookupField);
        if (lk != null && (typeof lk === "string" || typeof lk === "boolean" || typeof lk === "number")) {
            const normalizedKey = typeof lk === "string" ? lk.toLowerCase() : String(lk);
            const mapped =
                (wp.variantLookupMap as Record<string, string>)[String(lk)] ??
                (wp.variantLookupMap as Record<string, string>)[normalizedKey];
            if (typeof mapped === "string") {
                variant = mapped;
            }
        }
    }
    if (wp.variantFromRatingTenScale && data) {
        const path = typeof wp.variantFromRatingPath === "string" ? wp.variantFromRatingPath : binding.name;
        const r = resolvePath(data, path);
        if (typeof r === "number" && Number.isFinite(r)) {
            if (r >= 8) variant = "success";
            else if (r >= 6) variant = "warning";
            else variant = "destructive";
        }
    }

    const linkedPath = typeof wp.linkedRefPath === "string" ? wp.linkedRefPath : "";
    const linkedTarget = resolveLinkedSheetTarget(wp, data);
    const LinkedSheetWidget = linkedTarget ? resolveWidget(linkedTarget.widgetToken) : null;
    let linkedReferenceSheet:
        | {
              resourceId: string;
              LinkedSheet: ComponentType<DisplayCardLinkedSheetOuterProps>;
          }
        | undefined;
    if (linkedPath && linkedTarget && data && LinkedSheetWidget) {
        const raw = resolvePath(data, linkedPath);
        const normalized = normalizeObjectIdRef(raw);
        const id = normalized?.fetchId;
        if (id) {
            const bootstrap = bootstrapLinkedSmallInfoSheetData(
                id,
                raw,
                displayValue,
                linkedTarget.valueField,
            );
            const entityProp = linkedTarget.entityProp;
            const BoundLinkedSheet: ComponentType<DisplayCardLinkedSheetOuterProps> = (sheetProps) => {
                const { onLinkedDeleted, ...rest } = sheetProps;
                const refCtx = ctx.referenceCardUnitContext;
                const sheetPropsOut: Record<string, unknown> = {
                    ...rest,
                    fetchId: id,
                    onDelete: (..._args: unknown[]) => {
                        if (linkedPath.length > 0) {
                            ctx.unlinkEmbeddedRefPath?.(linkedPath);
                        }
                        onLinkedDeleted?.();
                    },
                };
                if (refCtx?.unitId) {
                    sheetPropsOut.unitId = refCtx.unitId;
                }
                if (refCtx?.unitName !== undefined) {
                    sheetPropsOut.unitName = refCtx.unitName;
                }
                sheetPropsOut[entityProp] = bootstrap;
                return createElement(LinkedSheetWidget as ComponentType<any>, sheetPropsOut);
            };
            linkedReferenceSheet = {
                resourceId: linkedTarget.model,
                LinkedSheet: BoundLinkedSheet,
            };
        }
    }

    const externalLinkValue =
        wp.externalLink === true &&
        typeof displayValue === "string" &&
        displayValue.trim().length > 0
            ? displayValue.trim()
            : undefined;

    let internalHrefValue: string | undefined;
    if (typeof wp.internalHrefTemplate === "string" && wp.internalHrefTemplate.trim().length > 0) {
        const linkedPathForHref = typeof wp.linkedRefPath === "string" ? wp.linkedRefPath : binding.name;
        const rawRef = data ? resolvePath(data, linkedPathForHref) : undefined;
        const normalized = normalizeObjectIdRef(rawRef);
        const id = normalized?.fetchId;
        if (id) {
            internalHrefValue = wp.internalHrefTemplate.replaceAll("{_id}", id);
        }
    }

    return (
        <Component
            key={index}
            title={label}
            tooltip={tooltipText}
            show={wp.show === true || hasDisplayCardValueAccess(ctx.access, binding)}
            path={binding.name}
            type={typeForCard}
            languageKeyCategory={
                typeof wp.languageKeyCategory === "string" && wp.languageKeyCategory.length > 0
                    ? wp.languageKeyCategory
                    : undefined
            }
            size={typeof wp.size === "number" ? wp.size : undefined}
            Icon={Icon ?? undefined}
            avatar={avatar}
            flagCode={flagCode}
            value={displayValue}
            variant={variant}
            dontRenderValue={!!wp.dontRenderValue || !!externalLinkValue}
            externalHref={externalLinkValue}
            internalHref={internalHrefValue}
            linkedReferenceSheet={linkedReferenceSheet}
            expandable={wp.expandable === true}
            maxLength={typeof wp.maxLength === "number" ? wp.maxLength : undefined}
        />
    );
}

function renderStringBadgeList(
    data: Record<string, any> | undefined,
    fieldName: string,
    maxItems?: number
): ReactNode {
    if (!data) return null;
    const list = resolvePath(data, fieldName);
    if (!Array.isArray(list) || list.length === 0) return <div className="mt-0.5"><ValueNotSet /></div> ;
    const limit = typeof maxItems === "number" && maxItems > 0 ? maxItems : list.length;
    const visible = list.slice(0, limit);
    const remaining = list.length - visible.length;
    return (
        <div className="flex flex-wrap gap-y-1 gap-x-1 mt-0.5">
            {visible.map((item: unknown, i: number) => (
                <Badge key={i} variant="outline">
                    {String(item)}
                </Badge>
            ))}
            {remaining > 0 && (
                <Badge variant="secondary">
                    +{remaining}
                </Badge>
            )}
        </div>
    );
}

function renderObjectNameBadgeList(
    data: Record<string, any> | undefined,
    fieldName: string,
    labelField: string
): ReactNode {
    if (!data) return null;
    const list = resolvePath(data, fieldName);
    if (!Array.isArray(list) || list.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-y-1 gap-x-1 mt-0.5">
            {list.map((item: any, i: number) => {
                const label = labelField.includes(".") ? resolvePath(item, labelField) : item?.[labelField];
                if (label == null || label === "") return null;
                return (
                    <Badge key={i} variant="outline">
                        {String(label)}
                    </Badge>
                );
            })}
        </div>
    );
}

function renderUnitTypeBadgeList(
    data: Record<string, any> | undefined,
    fieldName: string,
    access: Record<string, any> | undefined,
    readPermissionKey: string | undefined
): ReactNode {
    if (!data) return <div className="mt-0.5"><ValueNotSet /></div>;
    const list = resolvePath(data, fieldName);
    if (!Array.isArray(list) || list.length === 0) return <div className="mt-0.5"><ValueNotSet /></div>;

    const fieldAccess = readPermissionKey ? access?.[readPermissionKey] : undefined;
    const keys =
        fieldAccess && typeof fieldAccess === "object" && "keys" in fieldAccess
            ? (fieldAccess as { keys?: Record<string, boolean> }).keys ?? {}
            : {};
    const allowIcon = fieldAccess === true || keys.icon;
    const allowName = fieldAccess === true || keys.name;
    if (!allowIcon && !allowName) return null;

    const badges: ReactNode[] = [];
    list.forEach((property: any, i: number) => {
        badges.push(
            <Badge key={i} variant="outline">
                <HiddenElement showLock={true} randomLength={0}>
                    {allowIcon ? (
                        <>
                            {property?.icon ? (
                                <MdiIcon icon={property.icon} size={0.9} showFallback />
                            ) : null}
                        </>
                    ) : null}
                </HiddenElement>
                <HiddenElement showLock={true} randomLength={0}>
                    {allowName ? <>{property?.name ? <p>{property.name}</p> : null}</> : null}
                </HiddenElement>
            </Badge>
        );
    });

    if (badges.length === 0) return <div className="mt-0.5"><ValueNotSet /></div>;
    return <div className="flex flex-wrap gap-y-1 gap-x-1 mt-0.5">{badges}</div>;
}

function renderCurrencyList(
    data: Record<string, any> | undefined,
    fieldName: string,
    wp: Record<string, any>,
    resolveLanguageKey: ResolveLanguageKey
): ReactNode {
    if (!data) return null;
    const rawList = resolvePath(data, fieldName);
    const list = Array.isArray(rawList)
        ? rawList
        : rawList != null && typeof rawList === "object" && "value" in rawList
          ? [rawList]
          : [];
    if (list.length === 0) {
        return (
            <div className="flex items-center gap-x-0.5">
                <p>{resolveLanguageKey("none")}</p>
            </div>
        );
    }

    const andKey = wp.andKey ?? "and";

    return (
        <div className="text-success flex flex-wrap gap-x-1">
            {list.map((item: any, i: number) => {
                const currency = item.currency;
                const currencyName = currency?.abbreviation ?? currency?.symbol ?? currency?.name ?? "";
                const value = item.value ?? 0;
                const isLast = i === list.length - 1;
                const hasMultiple = list.length > 1;
                return (
                    <div className="flex items-center gap-x-0.5" key={i}>
                        {isLast && hasMultiple && <span> {resolveLanguageKey(andKey)} </span>}
                        <p>{String(currencyName)}</p>
                        <p>{value.toLocaleString()}</p>
                    </div>
                );
            })}
        
        </div>
    );
}
