import {screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import type {ReactNode} from "react";

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", async (importOriginal) => ({
    ...(await importOriginal<Record<string, unknown>>()),
    default: (await import("@coreModule/components/entityPage/list/card/_tests/probes.tsx")).fakeWithLanguage,
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({
    default: () => (Wrapped: unknown) => Wrapped,
}));
vi.mock("@coreModule/helpers/hooks/useViewConfig.ts", () => ({
    useViewConfig: () => ({model: "blogPosts", viewType: "sheet", nodes: []}),
}));
// Only the header slot matters here: render what the page hands it, nothing else.
vi.mock("@coreModule/components/viewEngine/SheetViewRenderer.tsx", () => ({
    default: ({headerDescription}: {headerDescription: ReactNode}) => <div data-testid="header">{headerDescription}</div>,
}));
vi.mock("@coreModule/clients/panel/private/blogPosts/center/actions/publishBlogPost.tsx", () => ({default: () => null, PUBLISH_BLOG_POST_ACTION: "publish"}));
vi.mock("@coreModule/clients/panel/private/blogPosts/center/actions/unpublishBlogPost.tsx", () => ({default: () => null, UNPUBLISH_BLOG_POST_ACTION: "unpublish"}));
vi.mock("@coreModule/clients/panel/private/blogPosts/center/dialogs/setBlogPostPublishedDialog.tsx", () => ({default: () => null}));

const {default: BlogPostSheetView} = await import("../center/sheetView/blogPostSheetView.tsx");
const {renderWithCardEnv, accessMap} = await import("@coreModule/components/entityPage/list/card/_tests/harness.tsx");

const post = {_id: "p1", title: "The summer edit is here", category: {_id: "c1", name: "Store News"}, published: false};

function renderSheet(read: unknown) {
    return renderWithCardEnv(
        <BlogPostSheetView open onOpenChange={() => {}} blogPost={post as never}/>,
        {access: accessMap("blogPosts", {read})},
    );
}

// The sheet header reused the card's published badge, which gates on the card's `AccessFields`; the sheet mounts
// outside the card, so a user allowed to read "published" saw the no-permission lock instead of the badge.
describe("blog post sheet header", () => {
    it("shows the published badge to a user who can read it", () => {
        renderSheet({title: {}, published: {}});
        expect(screen.getByTestId("header").textContent).toBe("t:unpublished");
    });

    it("keeps the badge hidden from a user who cannot read it", () => {
        renderSheet({title: {}});
        expect(screen.queryByText("t:unpublished")).toBeNull();
    });
});
