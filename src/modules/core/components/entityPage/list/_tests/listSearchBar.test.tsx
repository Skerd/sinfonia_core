import {act, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key}/>,
}));

import {ListSearchBar} from "../cardAndTableView.tsx";

function bar(overrides: Partial<Parameters<typeof ListSearchBar>[0]> = {}) {
    const props = {
        value: "",
        onSearch: vi.fn(),
        searchable: true,
        placeholder: "Search…",
        clearLabel: "Clear all",
        facets: null,
        hasFacets: false,
        onClearAll: vi.fn(),
        menu: <button type="button">filters</button>,
        ...overrides,
    };
    return {props, element: <ListSearchBar {...props}/>};
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

// D170: the Odoo-like search bar holds the active filters as tags; typing searches, the ✕ clears it all.
describe("the list search bar", () => {
    it("searches a moment after typing stops, at once on Enter", () => {
        const {props, element} = bar();
        render(element);
        const input = screen.getByLabelText("Search…");

        fireEvent.change(input, {target: {value: "gol"}});
        fireEvent.change(input, {target: {value: "golf"}});
        expect(props.onSearch).not.toHaveBeenCalled();
        act(() => vi.advanceTimersByTime(300));
        expect(props.onSearch).toHaveBeenCalledTimes(1);
        expect(props.onSearch).toHaveBeenLastCalledWith("golf");

        fireEvent.change(input, {target: {value: "golf gti"}});
        fireEvent.keyDown(input, {key: "Enter"});
        expect(props.onSearch).toHaveBeenLastCalledWith("golf gti");
    });

    it("clears the text with Escape, and the text and every filter with ✕", () => {
        const {props, element} = bar({value: "golf", facets: <span>Status: Confirmed</span>, hasFacets: true});
        render(element);
        const input = screen.getByLabelText("Search…") as HTMLInputElement;
        expect(screen.getByText("Status: Confirmed")).toBeTruthy();
        expect(input.placeholder).toBe("");

        fireEvent.keyDown(input, {key: "Escape"});
        expect(input.value).toBe("");
        expect(props.onSearch).toHaveBeenLastCalledWith("");

        fireEvent.click(screen.getByLabelText("Clear all"));
        expect(props.onClearAll).toHaveBeenCalledTimes(1);
    });

    it("follows a change from outside (back, a link) over a pending keystroke", () => {
        const {props, element} = bar({value: "golf"});
        const {rerender} = render(element);
        const input = screen.getByLabelText("Search…") as HTMLInputElement;

        fireEvent.change(input, {target: {value: "golf g"}});
        rerender(<ListSearchBar {...props} value="fiat"/>);
        act(() => vi.advanceTimersByTime(300));
        expect(input.value).toBe("fiat");
        expect(props.onSearch).not.toHaveBeenCalled();
    });

    it("holds only the filters when no field takes text", () => {
        render(bar({searchable: false, facets: <span>Status: Confirmed</span>, hasFacets: true}).element);
        expect(screen.queryByLabelText("Search…")).toBeNull();
        expect(screen.getByText("Status: Confirmed")).toBeTruthy();
        expect(screen.getByText("filters")).toBeTruthy();
    });
});
