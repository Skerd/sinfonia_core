import {render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key}/>,
}));

import Paginator from "../paginator/index.tsx";

const pager = (total: number) => (
    <Paginator total={total} limit={20} loading={false} setOffset={vi.fn()} setLimit={vi.fn()}/>
);

// A search changes the total on every keystroke (D170): the range shown follows it both ways.
describe("the pager's range", () => {
    it("narrows to a smaller total and widens back when the total grows", () => {
        const {rerender} = render(pager(74396));
        expect(screen.getByText("1-20")).toBeTruthy();

        rerender(pager(3));
        expect(screen.getByText("1-3")).toBeTruthy();

        rerender(pager(74396));
        expect(screen.getByText("1-20")).toBeTruthy();
    });

    it("shows no rows when nothing matches", () => {
        render(pager(0));
        expect(screen.getByText("0-0")).toBeTruthy();
    });
});
