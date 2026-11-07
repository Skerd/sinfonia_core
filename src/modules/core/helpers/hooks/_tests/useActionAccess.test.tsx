import {describe, expect, it, vi} from "vitest";
import type {ReactNode} from "react";
import {renderHook, waitFor} from "@testing-library/react";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import type {AccessAllFormResponseType} from "armonia/src/modules/core/api/user/private/permissions/accessAll.form.response.type.ts";

const {postMock} = vi.hoisted(() => ({postMock: vi.fn()}));

vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: {post: postMock}}));
vi.mock("@coreModule/helpers/hooks/useErrorHandler.ts", () => ({default: () => vi.fn()}));
vi.mock("@coreModule/components/custom/sessionSetupScreen.tsx", () => ({
    SessionSetupScreen: () => null,
    SESSION_SETUP_TOTAL_STEPS: 3,
}));

import {AccessProvider} from "@coreModule/helpers/context/accessContext.tsx";
import {useActionAccess} from "../useActionAccess.ts";

function wrapperWith(permissions: string[]) {
    const store = configureStore({reducer: {authentication: () => ({token: "t", user: {permissions}})}});
    return ({children}: {children: ReactNode}) => <Provider store={store}>{children}</Provider>;
}

const grants = {read: true, write: true, create: true, delete: true, restore: true, tableConfiguration: false};

/** `/access/all` lists a scoped model with `others`, a loose one without (as maestro does, keyed by collection). */
const ACCESS_ALL: AccessAllFormResponseType = {
    tickets: {self: grants, others: grants},
    notes: {self: grants},
};

/** The session's permissions plus the real `AccessProvider`, loaded with {@link ACCESS_ALL}. */
function providerWith(permissions: string[]) {
    postMock.mockResolvedValue({data: ACCESS_ALL});
    const Redux = wrapperWith(permissions);
    return ({children}: {children: ReactNode}) => <Redux><AccessProvider>{children}</AccessProvider></Redux>;
}

describe("useActionAccess", () => {
    it("reads maestro's action tag for the scope", () => {
        const wrapper = wrapperWith(["users[action:others:unlockActivation]", "channels[action:self:answerWebsiteChats]"]);
        expect(renderHook(() => useActionAccess("users", "unlockActivation", "others"), {wrapper}).result.current).toBe(true);
        expect(renderHook(() => useActionAccess("channels", "answerWebsiteChats"), {wrapper}).result.current).toBe(true);
    });

    it("does not let one scope stand in for the other", () => {
        const wrapper = wrapperWith(["users[action:self:unlockActivation]", "users[write:others:requests]"]);
        expect(renderHook(() => useActionAccess("users", "unlockActivation", "others"), {wrapper}).result.current).toBe(false);
    });

    it("reads the unscoped tag of a loose model once the access map shows it has no `others`", async () => {
        const wrapper = providerWith(["notes[action:archive]"]);
        const {result} = renderHook(() => useActionAccess("notes", "archive"), {wrapper});

        await waitFor(() => expect(result.current).toBe(true));
    });

    it("never grants `others` on a loose model, which has no such tag", async () => {
        const wrapper = providerWith(["notes[action:archive]", "notes[action:others:archive]"]);
        const {result} = renderHook(() => ({self: useActionAccess("notes", "archive"), others: useActionAccess("notes", "archive", "others")}), {wrapper});

        await waitFor(() => expect(result.current.self).toBe(true));
        expect(result.current.others).toBe(false);
    });

    it("keeps scoped models on scoped tags inside the access provider", async () => {
        const wrapper = providerWith(["tickets[action:self:close]", "tickets[action:close]"]);
        const {result} = renderHook(() => ({self: useActionAccess("tickets", "close"), others: useActionAccess("tickets", "close", "others")}), {wrapper});

        await waitFor(() => expect(postMock).toHaveBeenCalled());
        await waitFor(() => expect(result.current).toEqual({self: true, others: false}));
    });

    it("does not read a scoped tag as a loose model's grant", async () => {
        const wrapper = providerWith(["notes[action:self:archive]"]);
        const {result} = renderHook(() => useActionAccess("notes", "archive"), {wrapper});

        await waitFor(() => expect(postMock).toHaveBeenCalled());
        // Before the map loads the scoped tag is read, so wait for the loaded verdict.
        await waitFor(() => expect(result.current).toBe(false));
    });
});
