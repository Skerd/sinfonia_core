import {fireEvent, render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import type {ComponentType} from "react";

const {apiClientMock} = vi.hoisted(() => ({apiClientMock: vi.fn()}));

vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: apiClientMock}));
vi.mock("sonner", () => ({toast: Object.assign(vi.fn(), {loading: vi.fn(), success: vi.fn(), error: vi.fn(), dismiss: vi.fn()})}));
vi.mock("@coreModule/helpers/general/config.ts", () => ({
    getClientConfig: () => ({debugging: {enableFormPostInfo: false, enableFormResponseSuccessInfo: false, enableFormResponseErrorInfo: false}}),
}));
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key}/>,
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => Wrapped,
}));
vi.mock("react-redux", () => ({useSelector: (select: (state: unknown) => unknown) => select({language: {languageCode: "en-US"}})}));
// A module labels its own collections; core names none.
vi.mock("@coreModule/helpers/moduleContributions/loadRolesPermissionsContributions.ts", () => ({
    getMergedModuleRolesPermissions: () => ({groups: {Patients: "Patient folders"}}),
}));

// Each module says what it erases; only the company's own modules are listed.
vi.mock("@coreModule/helpers/moduleContributions/loadPersonErasureContributions.ts", () => ({
    getModulePersonErasureTexts: () => ({dentalClinic: "Medical histories are deleted.", carRental: "Licences are deleted."}),
}));

import ErasePersonSection from "../erasePersonSection.tsx";

const sent = () => apiClientMock.mock.calls.map(([config]) => config.data);

describe("erase a person", () => {
    it("says what the company's own modules erase", () => {
        render(<ErasePersonSection modules={["core", "dentalClinic", "eCommerce"]} />);
        expect(screen.getByText("Medical histories are deleted.")).toBeTruthy();
        expect(screen.getByText("chats")).toBeTruthy();
        expect(screen.queryByText("Licences are deleted.")).toBeNull();
    });

    it("previews with the modules' own labels, then erases only the previewed email once it is typed again", async () => {
        apiClientMock.mockResolvedValueOnce({data: {preview: true, counts: [{collection: "patients", anonymised: 1, deleted: 0}, {collection: "media", anonymised: 0, deleted: 2}]}});
        render(<ErasePersonSection modules={["dentalClinic"]} />);

        fireEvent.change(screen.getByLabelText("email"), {target: {value: " Giulia@Example.com "}});
        fireEvent.click(screen.getByText("preview"));
        expect(await screen.findByText("Patient folders: 1 anonymised")).toBeTruthy();
        expect(screen.getByText("files: 2 deleted")).toBeTruthy();
        expect(sent()[0]).toEqual({email: "giulia@example.com", preview: true});

        fireEvent.click(screen.getByText("erase"));
        const confirm = screen.getAllByText("erase").at(-1)!;
        expect(confirm.closest("button")!.disabled).toBe(true);
        fireEvent.change(screen.getByLabelText("confirmEmail"), {target: {value: "giulia@example.com"}});
        apiClientMock.mockResolvedValueOnce({data: {preview: false, counts: []}});
        fireEvent.click(screen.getAllByText("erase").at(-1)!);
        expect(await screen.findByText("done")).toBeTruthy();
        expect(sent()[1]).toEqual({email: "giulia@example.com", preview: false});
    });
});
