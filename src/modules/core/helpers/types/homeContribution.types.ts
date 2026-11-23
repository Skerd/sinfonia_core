import type {ResolveLanguageKey} from "@coreModule/helpers/hocs/withLanguage.tsx";
import type {ContributionBase} from "@coreModule/helpers/moduleContributions/contributionRegistry.ts";

/** What tells a setup step is done (D178). */
export type HomeSetupDoneWhen =
    /** A list route (`POST {offset, limit, ...params}` → `{total}`) answers at least `minTotal` rows (default 1). */
    | {list: {url: string; minTotal?: number; params?: Record<string, unknown>}}
    /** The current company (`GET /api/company`) has what the step asks for. */
    | {company: (company: Record<string, unknown>) => boolean};

/**
 * One tip of a guide (D179): it points at an element of the page by its `data-tour` key. Keys in use: `field.<name>`
 * (a form field, named as its form binding), `form.save`, `page.help`, `users.invite`, `nav:<url>` (a sidebar link),
 * `sidebar.company` (the company switcher) and `sidebar.account` (the account menu). A tip whose element is not on the
 * page is skipped.
 */
export type HomeGuideTip = {
    target: string;
    /** Already translated. */
    title: string;
    text: string;
};

/** A tour stop with its own words (D179): a tip, shown on the page at `to` when it has one. */
export type HomeTourTip = HomeGuideTip & {
    /** The page to open for this stop; without it the tip shows wherever the person is (e.g. a sidebar link). */
    to?: string;
    /** The access model the viewer must be able to read; the stop is left out otherwise. */
    accessModel?: string;
};

/**
 * A tour stop that opens a page and explains it with the page's own ⓘ help (D180): the tip points at the help control
 * and shows the help's title, overview and points, so the tour and the ⓘ never disagree. A page without help is skipped.
 */
export type HomeTourPage = {
    page: string;
    /** The access model the viewer must be able to read; the stop is left out otherwise. */
    accessModel?: string;
};

/** One stop of a module's tour (D179, D180): a tip of its own, or a page explained by its help. */
export type HomeTourStop = HomeTourTip | HomeTourPage;

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
    /** Tips walking the person through the step on its page, in order (D179). */
    guide?: HomeGuideTip[];
};

/** What a module gets to build its setup steps. */
export type HomeSetupContext = {
    resolveLanguageKey: ResolveLanguageKey;
    /** The company being set up: a step's page may name it (e.g. the company's own edit form, D179). */
    company: {id: string; name: string};
};

/**
 * Optional attach file: `src/modules/<pkg>/clients/panel/homeContribution.ts(x)` (D178). A module lists the steps a new
 * company of its kind takes to be ready; the panel home shows them to whoever may do them until they are done.
 */
export type HomeContribution = ContributionBase & {
    getSetupSteps: (ctx: HomeSetupContext) => HomeSetupStep[];
    /**
     * The module's tour, offered once setup is done and replayable from the account menu (D179): usually a short intro
     * tip, then every page of the module in sidebar order, each explained by its own help (D180).
     */
    getTour?: (ctx: HomeSetupContext) => HomeTourStop[];
};
