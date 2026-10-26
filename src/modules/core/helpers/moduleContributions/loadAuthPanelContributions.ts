import type {ComponentType} from "react";
import type {AuthPanelContribution} from "@coreModule/helpers/types/authPanelContribution.types.ts";
import {filterGlobByEnabledModules} from "@coreModule/helpers/modules/enabledModules.ts";
import {
    type ContributionGlob,
    createContributionList,
    getOwn,
    isComponentLike,
    isPlainObject,
    mergeRecords,
} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";
import {CORE_AUTH_PANEL_KEYS} from "@coreModule/helpers/moduleContributions/coreAuthPanelKeys.ts";

const KIND = "authPanelContribution";

export function createAuthPanelContributions(
    glob: ContributionGlob,
    reservedKeys: ReadonlySet<string> = new Set(CORE_AUTH_PANEL_KEYS),
) {
    const list = createContributionList<AuthPanelContribution>({
        kind: KIND,
        glob,
        isValid: (entry) => isPlainObject(entry.panels) && Object.values(entry.panels).every(isComponentLike),
        // Shown before sign-in, when no company's modules are known.
        companyScoped: false,
    });

    let panels: Readonly<Record<string, ComponentType>> | undefined;

    /** Merged panel key → component map; later contributions win, core keys are never replaced. */
    const getComponents = (): Readonly<Record<string, ComponentType>> =>
        (panels ??= mergeRecords(
            KIND,
            list().map((contribution) => ({source: contribution, record: contribution.panels})),
            reservedKeys,
        ));

    const resolve = (panel: string | undefined): ComponentType | undefined =>
        panel ? getOwn(getComponents(), panel) : undefined;

    return {list, getComponents, resolve};
}

const authPanelContributions = createAuthPanelContributions(
    filterGlobByEnabledModules(
        import.meta.glob<Record<string, unknown>>("@/modules/*/clients/panel/authPanelContribution.{tsx,ts}", {eager: true}),
    ),
);

/** Merged panel key → component map from enabled modules. */
export function getAuthPanelComponents(): Readonly<Record<string, ComponentType>> {
    return authPanelContributions.getComponents();
}

/** The module component for an `/authenticate/:panel` key, or `undefined` (never an inherited property). */
export function resolveAuthPanelComponent(panel: string | undefined): ComponentType | undefined {
    return authPanelContributions.resolve(panel);
}
