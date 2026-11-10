import {describe, expect, it} from "vitest";
import type {ReactNode} from "react";
import {renderHook} from "@testing-library/react";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import {useCompanyTimeZone} from "../useCompanyTimeZone.ts";

describe("useCompanyTimeZone (D116)", () => {
    it("reads the session company's zone, the one the server judges calendar days in", () => {
        const store = configureStore({reducer: {authentication: () => ({user: {company: {timezone: "Europe/Zurich"}}})}});
        const wrapper = ({children}: {children: ReactNode}) => <Provider store={store}>{children}</Provider>;

        expect(renderHook(() => useCompanyTimeZone(), {wrapper}).result.current).toBe("Europe/Zurich");
    });
});
