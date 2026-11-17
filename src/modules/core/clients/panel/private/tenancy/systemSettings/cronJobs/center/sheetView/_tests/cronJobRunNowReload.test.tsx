import {act, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key}/>,
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => Wrapped,
}));
vi.mock("@coreModule/helpers/hooks/useAccess.ts", () => ({useAccess: () => ({read: true, write: true})}));
vi.mock("@coreModule/helpers/hooks/useViewConfig.ts", () => ({useViewConfig: () => ({model: "cronjobs", nodes: []})}));
// The sheet shows the job's next run; the scheduler gives it the next slot once it has run the job.
vi.mock("@coreModule/components/viewEngine/SheetViewRenderer.tsx", () => ({
    default: ({data, actionMenuChildren}: {data: {nextRunAt?: string}; actionMenuChildren?: never}) => (
        <div>
            <span>next run: {data.nextRunAt}</span>
            {actionMenuChildren}
        </div>
    ),
}));
// Like the real hook, the answer is the same object until the next request.
const {requests, reloaded} = vi.hoisted(() => ({
    requests: [] as {url: string; data: unknown; count: number}[],
    reloaded: {_id: "j1", name: "POS fiscal sweep", nextRunAt: "20:05"},
}));
vi.mock("@coreModule/helpers/hooks/useHttpRequest.ts", () => ({
    default: (request: {url: string; data: unknown}, _payload: unknown, count: number) => {
        requests.push({url: request.url, data: request.data, count});
        return {loading: false, error: null, data: count > 0 ? reloaded : null};
    },
}));
vi.mock("../../actions/run.tsx", () => ({default: ({onAction}: {onAction: (a: string) => void}) => <button onClick={() => onAction("run")}>run now</button>}));
vi.mock("../../actions/pause.tsx", () => ({default: () => null}));
vi.mock("../../actions/resume.tsx", () => ({default: () => null}));
// The Run now dialog: the action answers with the job made due now.
vi.mock("../../actions/cronJobActionDialogs.tsx", () => ({
    default: ({action, job, onSuccess}: {action: string; job: object; onSuccess: (job: object) => void}) =>
        action === "run" ? <button onClick={() => onSuccess({...job, nextRunAt: "20:01"})}>confirm</button> : null,
}));
vi.mock("../cronJobExecutions.tsx", () => ({default: () => null}));

import CronJobSheetView from "../cronJobSheetView.tsx";

afterEach(() => vi.useRealTimers());

// TD-B239: after Run now the sheet kept the action's answer: "Next run" at the moment Run now was pressed (already past)
// and the old "Last run".
describe("cron job sheet after Run now", () => {
    it("reloads the job once the run is picked up, so Next run shows the next slot", () => {
        vi.useFakeTimers();
        render(<CronJobSheetView open onOpenChange={() => {}} cronJob={{_id: "j1", name: "POS fiscal sweep", nextRunAt: "20:00"} as never}/>);

        fireEvent.click(screen.getByText("run now"));
        fireEvent.click(screen.getByText("confirm"));
        expect(screen.getByText("next run: 20:01")).toBeTruthy();

        act(() => vi.advanceTimersByTime(3_000));
        expect(screen.getByText("next run: 20:05")).toBeTruthy();
        expect(requests.at(-1)).toMatchObject({url: "/api/auxiliary/cron-jobs/single", data: {_id: "j1"}, count: 1});
    });
});
