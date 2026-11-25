import {render} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";

const state = vi.hoisted(() => ({
    data: null as {_id: string} | null,
    error: null as {error_code?: string; message?: string} | null,
    loading: false,
}));

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Component: ComponentType<Record<string, unknown>>) => (props: Record<string, unknown>) => (
        <Component {...props} resolveLanguageKey={(key: string) => key} />
    ),
}));
vi.mock("@coreModule/helpers/hocs/withAxios.tsx", () => ({
    default: () => (Component: ComponentType<Record<string, unknown>>) => (props: Record<string, unknown>) => (
        <Component {...props} data={state.data} error={state.error} loading={state.loading} onFilterChange={() => undefined} />
    ),
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({
    default: () => (Component: ComponentType<Record<string, unknown>>) => Component,
}));

import ProfilePhoto from "../profilePhoto.tsx";

describe("ProfilePhoto", () => {
    beforeEach(() => {
        state.data = null;
        state.error = null;
        state.loading = false;
    });

    it("shows the person icon when the photo media is missing", () => {
        state.error = {error_code: "media_not_found", message: "Media not found"};

        const {container} = render(<ProfilePhoto photoUrl={null} setPhotoUrl={() => undefined} forceReloadPhoto={0} />);

        expect(container.querySelector(".tabler-icon-user")).not.toBeNull();
        expect(container.querySelector(".tabler-icon-rotate")).toBeNull();
        expect(container.textContent).not.toContain("Media not found");
    });
});
