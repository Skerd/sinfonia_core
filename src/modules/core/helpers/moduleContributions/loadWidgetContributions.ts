import type {WidgetContribution} from "@coreModule/helpers/types/widgetContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";
import {
    type ContributionGlob,
    createContributionList,
    isComponentLike,
    isFunction,
    isOptionalRecordOf,
    isPlainObject,
    isString,
} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";

const isStringArrayOrUndefined = (value: unknown) =>
    value === undefined || (Array.isArray(value) && value.every(isString));

const isAuditHint = (value: unknown) =>
    isPlainObject(value) && isString(value.url) && Array.isArray(value.labelFields) && value.labelFields.every(isString);

function isValidWidgetContribution(entry: Record<string, unknown>): boolean {
    return isOptionalRecordOf(entry.widgets, isComponentLike)
        && isOptionalRecordOf(entry.widgetMeta, isPlainObject)
        && isOptionalRecordOf(entry.referencesDefaultItemProps, isString)
        && isOptionalRecordOf(entry.sheetFieldRenderers, isFunction)
        && isStringArrayOrUndefined(entry.compoundFormWidgets)
        && isOptionalRecordOf(entry.compoundFormWidgetRenderers, isFunction)
        && isOptionalRecordOf(entry.formWriteAccessKeys, isString)
        && isOptionalRecordOf(entry.auditSinglePostHints, isAuditHint);
}

export function createWidgetContributions(glob: ContributionGlob) {
    return {
        list: createContributionList<WidgetContribution>({
            kind: "widgetContribution",
            glob,
            isValid: isValidWidgetContribution,
            // Widgets render shared records (e.g. a reference into another module); keep them all.
            companyScoped: false,
        }),
    };
}

const widgetContributions = createWidgetContributions(
    filterGlobByEnabledModules(
        import.meta.glob<Record<string, unknown>>("@/modules/*/clients/panel/widgetContribution.{tsx,ts}", {eager: true}),
    ),
);

/**
 * All package `widgetContribution` entries, sorted by `order`, then `id`, then file path.
 * Does not import `widgetRegistry` (avoids circular init with eager globs); the registry merges them.
 */
export function getSortedWidgetContributions(): readonly WidgetContribution[] {
    return widgetContributions.list();
}
