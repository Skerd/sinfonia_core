import {act, render, screen, waitFor} from "@testing-library/react";
import {beforeEach, describe, expect, it, vi} from "vitest";

const {post} = vi.hoisted(() => ({post: vi.fn()}));
vi.mock("@coreModule/helpers/apiClient/apiClient.ts", () => ({default: {post}}));
vi.mock("react-redux", async (importOriginal) => ({
    ...await importOriginal<typeof import("react-redux")>(),
    useSelector: (select: (state: unknown) => unknown) => select({authentication: {user: {company: {_id: "platform"}}}}),
}));

import {readUploadReviewCounts, useUploadReviewWaiting} from "../useUploadReviewWaiting.ts";
import {handleWebSocketMessage} from "@coreModule/helpers/websocket/webSocketMessages.ts";
import type {AppDispatch} from "@coreModule/helpers/redux/store/generalStore.ts";

function Badge({enabled}: {enabled: boolean}) {
    return <p>waiting {useUploadReviewWaiting(enabled)}</p>;
}

const frame = (counts: unknown) => JSON.stringify({code: "UPLOAD_REVIEW_COUNTS", payload: {counts}});
const dispatch: AppDispatch = vi.fn();

beforeEach(() => {
    post.mockReset();
});

describe("the upload review badge (D177)", () => {
    it("reads the waiting count once, then follows the counts the server sends", async () => {
        post.mockResolvedValue({data: {flagged: 3, rejected: 0, approved: 1, refused: 2}});
        render(<Badge enabled/>);
        expect(await screen.findByText("waiting 3")).toBeInTheDocument();
        expect(post).toHaveBeenCalledWith("/api/auxiliary/uploadReview/counts", {}, expect.anything());

        act(() => handleWebSocketMessage(frame({flagged: 4, rejected: 0, approved: 1, refused: 2}), {dispatch, userId: "u1"}));
        expect(screen.getByText("waiting 4")).toBeInTheDocument();
        // A frame that does not carry all four counts is ignored.
        act(() => handleWebSocketMessage(frame({flagged: 9}), {dispatch, userId: "u1"}));
        expect(screen.getByText("waiting 4")).toBeInTheDocument();
    });

    it("stays at 0 without asking when the session may not review", async () => {
        render(<Badge enabled={false}/>);
        await waitFor(() => expect(screen.getByText("waiting 0")).toBeInTheDocument());
        expect(post).not.toHaveBeenCalled();
    });

    it("reads a counts frame field by field", () => {
        expect(readUploadReviewCounts({counts: {flagged: 1, rejected: 2, approved: 3, refused: 4}})).toEqual({flagged: 1, rejected: 2, approved: 3, refused: 4});
        expect(readUploadReviewCounts({counts: {flagged: "1", rejected: 2, approved: 3, refused: 4}})).toBeNull();
        expect(readUploadReviewCounts({})).toBeNull();
    });
});
