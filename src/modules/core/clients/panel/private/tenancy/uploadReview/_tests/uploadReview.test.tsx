import {fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";
import type {ComponentType, ReactNode} from "react";
import type {UploadReviewItem, UploadReviewListResponse} from "armonia/src/modules/core/api/auxiliary/private/uploadReview/uploadReview.dto.ts";

const {apiClientMock, access} = vi.hoisted(() => ({
    apiClientMock: vi.fn(),
    access: {platform: true, review: true},
}));

vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: apiClientMock}));
vi.mock("sonner", () => ({toast: Object.assign(vi.fn(), {loading: vi.fn(), success: vi.fn(), error: vi.fn(), dismiss: vi.fn()})}));
vi.mock("@coreModule/helpers/general/config.ts", () => ({
    getClientConfig: () => ({debugging: {enableFormPostInfo: false, enableFormResponseSuccessInfo: false, enableFormResponseErrorInfo: false}}),
}));
vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", async (importOriginal) => ({
    ...await importOriginal<object>(),
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key}/>,
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => Wrapped,
}));
vi.mock("@coreModule/helpers/hooks/useIsPlatformCompany.ts", () => ({useIsPlatformCompany: () => access.platform}));

vi.mock("@coreModule/helpers/hooks/useActionAccess.ts", () => ({useActionAccess: () => access.review}));
vi.mock("@coreModule/helpers/context/accessContext.tsx", async (importOriginal) => ({
    ...await importOriginal<typeof import("@coreModule/helpers/context/accessContext.tsx")>(),
    useAccessHydrated: () => true,
}));
vi.mock("@coreModule/components/custom/pages/forbidden.tsx", () => ({default: () => <p>forbidden</p>}));
// The card rows read the session's time zone from the store; here they only need to show their values.
vi.mock("@coreModule/components/entityPage/list/card/entityCardRow.tsx", () => ({
    default: ({label, value, show}: {label: string; value: unknown; show?: boolean}) =>
        show === false ? null : <p>{label}: {String(value)}</p>,
}));
vi.mock("@coreModule/components/custom/infoRowGroup.tsx", () => ({InfoRowGroup: ({children}: {children: ReactNode}) => <div>{children}</div>}));

import {MemoryRouter} from "react-router-dom";
import {Provider} from "react-redux";
import {combineReducers, configureStore} from "@reduxjs/toolkit";
import authenticationReducer from "@coreModule/helpers/redux/slices/authSlice.ts";
import languageReducer from "@coreModule/helpers/redux/slices/languageSlice.ts";
import UploadReview from "../index.tsx";

/** The page in a router (it reads `?open=`) with the session store its sheet's cards read (time zone, language). */
const renderPage = (path = "/tenancy/uploadReview") => {
    const store = configureStore({reducer: combineReducers({authentication: authenticationReducer, language: languageReducer})});
    return render(<Provider store={store}><MemoryRouter initialEntries={[path]}><UploadReview /></MemoryRouter></Provider>);
};

const flagged: UploadReviewItem = {
    _id: "6b031efa34989254f8797cf3", kind: "media", fileName: "beach.jpg", mimeType: "image/jpeg", fileSize: 10,
    company: {_id: "c1", name: "Kudoo Market"}, uploadedBy: {_id: "u1", name: "Ana Shop"}, uploadedAt: "2026-11-22T10:00:00.000Z",
    status: "flagged", scores: {porn: 0.62, hentai: 0.01, sexy: 0.3, neutral: 0.07, drawing: 0},
};
const refusal: UploadReviewItem = {
    _id: "r1", kind: "refusal", fileName: "nude.jpg", mimeType: "image/jpeg", company: {_id: "c1", name: "Kudoo Market"},
    uploadedAt: "2026-11-22T10:00:00.000Z", status: "refused", scores: {porn: 0.97, hentai: 0, sexy: 0.02, neutral: 0.01, drawing: 0}, fileHash: "ab".repeat(32),
};
const page = (items: UploadReviewItem[]): UploadReviewListResponse =>
    ({items, total: items.length, page: 1, limit: 24, counts: {flagged: 1, rejected: 2, approved: 0, refused: 3}});
const listCalls = () => apiClientMock.mock.calls.map(([config]) => config).filter((config) => String(config.url).endsWith("/list"));

beforeEach(() => {
    apiClientMock.mockReset();
    access.platform = true;
    access.review = true;
    Element.prototype.scrollIntoView = () => undefined;
});

describe("the upload review page (D177)", () => {
    it("lists the waiting files with each list's count, covered, and approves one after confirming", async () => {
        apiClientMock.mockImplementation(async (config: {url: string}) =>
            config.url.endsWith("/list") ? {data: page([flagged])} : {data: {...flagged, status: "approved"}});
        renderPage();

        expect(await screen.findByText("beach.jpg")).toBeInTheDocument();
        expect(listCalls()[0]).toMatchObject({url: "/api/auxiliary/uploadReview/list", data: {view: "flagged", page: 1, limit: 24}});
        expect(screen.getByRole("tab", {name: /views.refused\s*3/})).toBeInTheDocument();
        expect(screen.getByText("score: 62%")).toBeInTheDocument();
        // The reviewer sees the server's blurred copy under the cover until they show it.
        expect(screen.getByRole("img")).toHaveAttribute("src", `/api/auxiliary/media/review/${flagged._id}`);
        expect(screen.getByText("May contain nudity")).toBeInTheDocument();
        // A waiting file can be approved or removed.
        expect(screen.getByRole("button", {name: /remove/})).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", {name: /^approve$/}));
        const dialog = await screen.findByRole("alertdialog");
        fireEvent.click(within(dialog).getByRole("button", {name: "approve.confirm"}));

        await waitFor(() => expect(apiClientMock).toHaveBeenCalledWith(expect.objectContaining({
            url: "/api/auxiliary/uploadReview/approve", data: {_id: flagged._id},
        })));
        await waitFor(() => expect(listCalls()).toHaveLength(2));
    });

    it("shows another list from its tab, a refused upload without a file or decisions", async () => {
        apiClientMock.mockImplementation(async (config: {data: {view: string}}) => ({data: page(config.data.view === "refused" ? [refusal] : [])}));
        renderPage();
        await screen.findByText("empty.flagged.title");

        fireEvent.mouseDown(screen.getByRole("tab", {name: /views.refused/}), {button: 0});

        expect(await screen.findByText("nude.jpg")).toBeInTheDocument();
        expect(listCalls().at(-1)).toMatchObject({data: {view: "refused", page: 1}});
        expect(screen.getByText("notStored")).toBeInTheDocument();
        expect(screen.queryByRole("button", {name: /approve|remove/})).toBeNull();
    });

    it("opens a file's large view from its preview once it is shown, not while covered", async () => {
        apiClientMock.mockResolvedValue({data: page([{...flagged, _id: "6b031efa34989254f8797cf4", fileName: "pool.jpg"}])});
        renderPage();
        await screen.findByText("pool.jpg");
        expect(screen.queryByRole("button", {name: "view: pool.jpg"})).toBeNull();

        fireEvent.click(screen.getByRole("button", {name: /^Show/}));
        fireEvent.click(screen.getByRole("button", {name: "view: pool.jpg"}));

        const dialog = await screen.findByRole("dialog");
        expect(within(dialog).getByRole("img")).toHaveAttribute("src", "/api/auxiliary/media/review/6b031efa34989254f8797cf4?reveal=1");
    });

    it("opens a file's sheet from its card, with the upload, the scores and the file grouped", async () => {
        apiClientMock.mockResolvedValue({data: page([{...flagged, fileType: "image", isPublic: true, inUse: false, checkedAt: "2026-11-22T10:01:00.000Z"}])});
        renderPage();
        fireEvent.click(await screen.findByRole("button", {name: "details"}));

        const sheet = await screen.findByRole("dialog");
        expect(within(sheet).getByText("groups.upload")).toBeInTheDocument();
        expect(within(sheet).getByText("groups.contentCheck")).toBeInTheDocument();
        expect(within(sheet).getByText("groups.file")).toBeInTheDocument();
        expect(within(sheet).getByText("inUse.no")).toBeInTheDocument();
        expect(within(sheet).getByText("62%")).toBeInTheDocument();
        expect(within(sheet).getByText("fileTypes.image")).toBeInTheDocument();
        // Nobody has decided yet: no review group.
        expect(within(sheet).queryByText("groups.review")).toBeNull();
    });

    it("opens the sheet of the file a notice links to", async () => {
        apiClientMock.mockImplementation(async (config: {url: string}) =>
            config.url.endsWith("/single") ? {data: {...flagged, fileName: "from-notice.jpg"}} : {data: page([])});
        renderPage(`/tenancy/uploadReview?open=${flagged._id}`);

        const sheet = await screen.findByRole("dialog");
        expect(sheet.querySelector("[data-slot=sheet-title]")).toHaveTextContent("from-notice.jpg");
        expect(apiClientMock).toHaveBeenCalledWith(expect.objectContaining({url: "/api/auxiliary/uploadReview/single", data: {_id: flagged._id}}));
    });

    it("is forbidden outside the platform company or without the review permission", () => {
        access.platform = false;
        const {unmount} = renderPage();
        expect(screen.getByText("forbidden")).toBeInTheDocument();
        unmount();
        access.platform = true;
        access.review = false;
        renderPage();
        expect(screen.getByText("forbidden")).toBeInTheDocument();
        expect(apiClientMock).not.toHaveBeenCalled();
    });
});
