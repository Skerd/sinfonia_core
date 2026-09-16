import {render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";

vi.mock("sonner", () => ({
    toast: Object.assign(vi.fn(), {loading: vi.fn(), success: vi.fn(), error: vi.fn(), dismiss: vi.fn()}),
}));

import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";

function View(props: Record<string, any>) {
    return (
        <div>
            <p data-testid="loading">{String(props.loading)}</p>
            <p data-testid="error">{String(props.error)}</p>
            <p data-testid="data">{String(props.data)}</p>
        </div>
    );
}

describe("withDebug", () => {
    /* Every call site passes `hideDebug: true`, so this is the path that actually runs in the app. */
    it("returns the component untouched when debug is hidden, adding no wrapper at all", () => {
        expect(withDebug(true, true)(View)).toBe(View);
        expect(withDebug(true, true, "cities")(View)).toBe(View);
    });

    /* jsdom serves the suite from localhost, so `hideDebug: false` takes the debug path. */
    it("renders the debug badge above the component when shown", () => {
        const Wrapped = withDebug(false, false)(View);

        render(<Wrapped data="rows"/>);

        expect(screen.getByText("0/4")).toBeInTheDocument();
        expect(screen.getByTestId("data")).toHaveTextContent("rows");
    });

    it("counts the HOC metadata props present on the badge", () => {
        const Wrapped = withDebug(false, false)(View);

        render(<Wrapped withLanguage={{languageCode: "en-US", path: "src/x.tsx"}} withAxios={{httpRequest: {}}}/>);

        expect(screen.getByText("2/4")).toBeInTheDocument();
    });

    it("passes the component's own loading/error/data through untouched", () => {
        const Wrapped = withDebug(false, false)(View);

        render(<Wrapped loading={true} error="boom" data="rows"/>);

        expect(screen.getByTestId("loading")).toHaveTextContent("true");
        expect(screen.getByTestId("error")).toHaveTextContent("boom");
        expect(screen.getByTestId("data")).toHaveTextContent("rows");
    });
});
