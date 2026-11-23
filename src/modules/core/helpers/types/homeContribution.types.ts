import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {ContributionBase} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";

/** What tells a setup step is done (D178). */
export type HomeSetupDoneWhen =
    /** A list route (`POST {offset, limit, ...params}` → `{total}`) answers at least `minTotal` rows (default 1). */
    | {list: {url: string; minTotal?: number; params?: Record<string, unknown>}}
    /** The current company (`GET /api/company`) has what the step asks for. */
    | {company: (company: Record<string, unknown>) => boolean};

/** One step of a company's setup checklist on the panel home (D178). */
export type HomeSetupStep = {
    /** Unique across modules, e.g. `carRental.vehicle`. */
    key: string;
    /** Translated through the home page's dictionary: core's sidebar keys, a module's own `menus.json` under `menus.<module>`. */
    title: string;
    description?: string;
    /** The panel page where the step is done. */
    to: string;
    /** The access model the viewer must be able to create in (or write, for company steps); the step is left out otherwise. */
    accessModel: string;
    doneWhen: HomeSetupDoneWhen;
};

/** What a module gets to build its setup steps. */
export type HomeSetupContext = {
    resolveLanguageKey: ResolveLanguageKey;
};

/**
 * Optional attach file: `src/modules/<pkg>/clients/panel/homeContribution.ts(x)` (D178). A module lists the steps a new
 * company of its kind takes to be ready; the panel home shows them to whoever may do them until they are done.
 */
export type HomeContribution = ContributionBase & {
    getSetupSteps: (ctx: HomeSetupContext) => HomeSetupStep[];
};
