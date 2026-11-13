import {createContext} from "react";

/**
 * Bumped by the scheduled-action sheet after "Run now", so the run history the view places above Lifecycle
 * (`#CronJobRuns`, TD-F67) reloads from the newest run.
 */
export const CronJobRunsRefresh = createContext(0);
