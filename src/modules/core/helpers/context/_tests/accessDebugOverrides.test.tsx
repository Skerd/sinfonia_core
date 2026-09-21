import {act, render, screen, waitFor} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import type {ReactNode} from "react";

const {postMock} = vi.hoisted(() => ({postMock: vi.fn()}));

vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: {post: postMock}}));
vi.mock("@coreModule/helpers/hooks/useErrorHandler.ts", () => ({default: () => () => undefined}));
vi.mock("@coreModule/components/custom/sessionSetupScreen.tsx", () => ({
    SessionSetupScreen: () => null,
    SESSION_SETUP_TOTAL_STEPS: 3,
}));

import {
    AccessProvider,
    useAccessDebugOverrides,
} from "@coreModule/helpers/context/accessContext.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";

/** Server shape: `read` is a field map, so `name` and `code` are readable and `secret` is not. */
const ACCESS_RESPONSE = {
    Cities: {
        self: {
            read: {name: {}, code: {}},
            write: {name: {}},
            create: true,
            delete: false,
            restore: false,
        },
    },
};

function Probe() {
    const access = useAccess("cities");
    const debugOverrides = useAccessDebugOverrides();

    return (
        <div>
            <span data-testid="read">{JSON.stringify(access.read)}</span>
            <span data-testid="create">{String(access.create)}</span>
            <span data-testid="has-context">{String(!!debugOverrides)}</span>
            <button onClick={() => debugOverrides?.setOverrides({cities: {self: {read: false}}})}>deny-read</button>
            <button onClick={() => debugOverrides?.setOverrides({cities: {self: {readFields: {name: false}}}})}>
                deny-name
            </button>
            <button onClick={() => debugOverrides?.setOverrides({cities: {self: {create: false}}})}>deny-create</button>
            <button onClick={() => debugOverrides?.setOverrides({})}>reset</button>
        </div>
    );
}

const wrapper = ({children}: {children: ReactNode}) => {
    const store = configureStore({
        reducer: {authentication: () => ({token: "test-token", user: {timezone: "UTC"}})},
    });
    return (
        <Provider store={store}>
            <AccessProvider>{children}</AccessProvider>
        </Provider>
    );
};

async function renderProbe() {
    render(<Probe/>, {wrapper});
    await waitFor(() => expect(screen.getByTestId("read")).toHaveTextContent("name"));
}

describe("withDebug access overrides reach useAccess", () => {
    beforeEach(() => {
        postMock.mockReset();
        postMock.mockResolvedValue({data: ACCESS_RESPONSE});
    });

    it("serves the server map when nothing is overridden", async () => {
        await renderProbe();

        expect(screen.getByTestId("read")).toHaveTextContent('{"name":{},"code":{}}');
        expect(screen.getByTestId("create")).toHaveTextContent("true");
        expect(screen.getByTestId("has-context")).toHaveTextContent("true");
    });

    /* The master switch in the debug panel writes `{read: false}`. */
    it("denies the whole read map when read is switched off", async () => {
        await renderProbe();

        act(() => {
            screen.getByText("deny-read").click();
        });

        expect(screen.getByTestId("read")).toHaveTextContent("false");
    });

    /* Unticking one field writes `{readFields: {name: false}}`. */
    it("removes just the denied field from the read map", async () => {
        await renderProbe();

        act(() => {
            screen.getByText("deny-name").click();
        });

        expect(screen.getByTestId("read")).toHaveTextContent('{"code":{}}');
    });

    it("applies boolean flags and restores the server value when cleared", async () => {
        await renderProbe();

        act(() => {
            screen.getByText("deny-create").click();
        });
        expect(screen.getByTestId("create")).toHaveTextContent("false");

        act(() => {
            screen.getByText("reset").click();
        });
        expect(screen.getByTestId("create")).toHaveTextContent("true");
        expect(screen.getByTestId("read")).toHaveTextContent('{"name":{},"code":{}}');
    });
});
