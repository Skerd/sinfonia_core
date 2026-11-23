/**
 * Where a person is in the guided first run (D179), kept for the tab so a reload carries on: a setup step's tips, the
 * card after a step, or the tour of the daily pages. Bound to the company it started in.
 */
export type GuideRun =
    /** A setup step's tips; `seenPage` once the step's page was reached, so leaving it means "check whether it's done". */
    | {kind: "step"; companyId: string; stepKey: string; tip: number; seenPage: boolean}
    /** The card after a step's page was left: done or not (`finished`), with the next open step, or none when setup is complete. */
    | {kind: "done"; companyId: string; stepKey: string; finished: boolean; nextKey?: string}
    | {kind: "tour"; companyId: string; stop: number};

const STORAGE_KEY = "panel_guide_run";

function isGuideRun(value: unknown): value is GuideRun {
    if (typeof value !== "object" || value === null) return false;
    const run = value as Record<string, unknown>;
    if (typeof run.companyId !== "string") return false;
    if (run.kind === "step") return typeof run.stepKey === "string" && typeof run.tip === "number" && typeof run.seenPage === "boolean";
    if (run.kind === "done") {
        return typeof run.stepKey === "string" && typeof run.finished === "boolean" && (run.nextKey === undefined || typeof run.nextKey === "string");
    }
    return run.kind === "tour" && typeof run.stop === "number";
}

/** The run saved for this tab, if it belongs to `companyId`. */
export function readGuideRun(companyId: string): GuideRun | null {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        const run: unknown = raw ? JSON.parse(raw) : null;
        return isGuideRun(run) && run.companyId === companyId ? run : null;
    } catch {
        return null;
    }
}

export function writeGuideRun(run: GuideRun | null): void {
    try {
        if (run) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(run));
        else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        // A blocked storage keeps the run for this page only.
    }
}

/** Whether `pathname` is the page `to` names (no query, no trailing slash). */
export function isOnPage(pathname: string, to: string): boolean {
    const strip = (path: string) => path.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
    return strip(pathname) === strip(to);
}
