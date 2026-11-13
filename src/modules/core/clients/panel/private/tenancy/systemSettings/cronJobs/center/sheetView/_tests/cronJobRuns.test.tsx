import {render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import type {ViewNode} from "armonia/src/modules/core/api/auxiliary/private/viewConfig";

// Core's own contribution only (CORE-01).
vi.mock("@coreModule/helpers/moduleContributions/loadWidgetContributions.ts", () => ({getSortedWidgetContributions: () => []}));
vi.mock("@coreModule/helpers/hooks/useAccess.ts", () => ({
    useAccess: () => ({read: {cronExpression: {}, status: {}}}),
}));
vi.mock("react-redux", () => ({
    useSelector: (selector: (state: {authentication: {user: {timezone: string}}}) => unknown) =>
        selector({authentication: {user: {timezone: "UTC"}}}),
}));
const httpCalls: {body: unknown; count: number}[] = [];
vi.mock("@coreModule/helpers/hooks/useHttpRequest.ts", () => ({
    default: (_request: unknown, body: unknown, count: number) => {
        httpCalls.push({body, count});
        return {loading: false};
    },
}));

const {getSheetFieldRenderer} = await import("@coreModule/components/viewEngine/widgetRegistry.ts");
const {default: CronJobRuns} = await import("../cronJobRuns.tsx");
const {CronJobRunsRefresh} = await import("../cronJobRunsRefresh.ts");

const t = ((key: string) => `t:${key}`) as never;
const job = {_id: "job1", active: true, nextRunsPreview: ["2026-11-14T02:00:00.000Z"]} as never;

describe("#CronJobRuns (TD-F67)", () => {
    it("is a core sheet token that renders nothing without a loaded job", () => {
        const renderer = getSheetFieldRenderer("#CronJobRuns");
        expect(renderer).toBeTypeOf("function");
        const node: ViewNode = {render: "#CronJobRuns", field: {name: "_id", widget: "#CronJobRuns"}};
        const args = {node, binding: node.field!, index: 0, Component: null};
        expect(renderer?.({...args, ctx: {mode: "sheet", data: undefined, resolveLanguageKey: t} as never})).toBeNull();
        expect(renderer?.({...args, ctx: {mode: "sheet", data: {name: "x"}, resolveLanguageKey: t} as never})).toBeNull();
    });

    it("shows the next runs and the run history, reloading the history when the sheet bumps the context", () => {
        const {rerender} = render(
            <CronJobRunsRefresh.Provider value={0}>
                <CronJobRuns job={job} resolveLanguageKey={t} />
            </CronJobRunsRefresh.Provider>,
        );
        expect(screen.getByText("t:nextRuns")).toBeInTheDocument();
        expect(screen.getByText("t:executions.title")).toBeInTheDocument();
        const before = httpCalls.at(-1)?.count ?? 0;

        rerender(
            <CronJobRunsRefresh.Provider value={1}>
                <CronJobRuns job={job} resolveLanguageKey={t} />
            </CronJobRunsRefresh.Provider>,
        );
        expect(httpCalls.at(-1)?.count).toBeGreaterThan(before);
    });

    it("leaves the next runs off for a paused job", () => {
        render(<CronJobRuns job={{...(job as object), pausedAt: "2026-11-13T00:00:00.000Z"} as never} resolveLanguageKey={t} />);
        expect(screen.queryByText("t:nextRuns")).toBeNull();
        expect(screen.getByText("t:executions.title")).toBeInTheDocument();
    });
});
