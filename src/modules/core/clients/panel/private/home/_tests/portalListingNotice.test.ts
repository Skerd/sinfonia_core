import {describe, expect, it} from "vitest";
import {portalListingNoticeOf} from "../portalListingNotice.tsx";

describe("the portal listing notice on the panel home (TD-F159)", () => {
    it("speaks while the listing waits for approval or was turned down", () => {
        expect(portalListingNoticeOf({portalApproval: {status: "pending"}})).toBe("pending");
        expect(portalListingNoticeOf({portalApproval: {status: "rejected", reason: "No address"}})).toBe("rejected");
    });

    it("says nothing for an approved company or one the platform created", () => {
        expect(portalListingNoticeOf({portalApproval: {status: "approved"}})).toBeNull();
        expect(portalListingNoticeOf({})).toBeNull();
        expect(portalListingNoticeOf(undefined)).toBeNull();
    });
});
