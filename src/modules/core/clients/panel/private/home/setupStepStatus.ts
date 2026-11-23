import {requestFromApi} from "@coreModule/helpers/apiClient/requestFromApi.ts";
import type {HomeSetupStep, HomeTourStop} from "@coreModule/helpers/types/homeContribution.types.ts";

export type SetupAccessEntry = {self?: {create?: unknown; write?: unknown; read?: unknown}};
export type SetupAccessMap = Record<string, SetupAccessEntry | undefined>;

/** Whether the viewer may do the step: create in a list's model, write the company for a company step (D178). */
export function canDoStep(step: HomeSetupStep, accessMap: SetupAccessMap): boolean {
    const grants = accessMap[step.accessModel.toLowerCase()]?.self;
    return "company" in step.doneWhen ? !!grants?.write : !!grants?.create;
}

/** Whether the viewer may see a tour stop's page (D179); a stop without a model is for everyone. */
export function canSeeTourStop(stop: HomeTourStop, accessMap: SetupAccessMap): boolean {
    return stop.accessModel === undefined || !!accessMap[stop.accessModel.toLowerCase()]?.self?.read;
}

/**
 * Asks the server whether a step is done, as the checklist does (D178): a list's total, or the company itself. Silent:
 * a failed check only means the guide does not offer this step as done.
 */
export async function isStepDone(step: HomeSetupStep): Promise<boolean> {
    if ("company" in step.doneWhen) {
        // `GET /api/company` answers the company itself, with no `data` wrapper.
        const company = await requestFromApi<Record<string, unknown>>({method: "get", url: "/api/company", silent: true});
        return step.doneWhen.company(company);
    }
    const {url, minTotal = 1, params} = step.doneWhen.list;
    const list = await requestFromApi<{total?: number}>({method: "post", url, data: {...params, offset: 0, limit: 1}, silent: true});
    return (list.total ?? 0) >= minTotal;
}

/** The first step after `afterKey` that is not done yet, asked in order; undefined when every later step is done. */
export async function nextOpenStep(steps: HomeSetupStep[], afterKey: string): Promise<HomeSetupStep | undefined> {
    const start = steps.findIndex((step) => step.key === afterKey) + 1;
    // Then wrap round: an earlier step skipped on the way is still open.
    const order = [...steps.slice(start), ...steps.slice(0, Math.max(start - 1, 0))];
    for (const step of order) {
        if (!(await isStepDone(step).catch(() => false))) return step;
    }
    return undefined;
}
