import {render, screen} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import type {ComponentType, ReactNode} from "react";

vi.mock("@coreModule/helpers/hocs/withLanguage.tsx", async (original) => ({
    ...(await original<object>()),
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) =>
        (props: Record<string, unknown>) => <Wrapped {...props} resolveLanguageKey={(key: string) => key}/>,
}));
vi.mock("@coreModule/helpers/hocs/withDebug.tsx", () => ({
    default: () => (Wrapped: ComponentType<Record<string, unknown>>) => Wrapped,
}));
vi.mock("@coreModule/components/entityPage/list/card/entityCard.tsx", () => {
    const EntityCard = ({entity, children}: {entity: unknown; children: (args: object) => ReactNode}) => <div>{children({entity, read: {}, setAction: () => {}})}</div>;
    EntityCard.Header = ({title}: {title: ReactNode}) => <h3>{title}</h3>;
    EntityCard.Body = ({children}: {children: ReactNode}) => <div>{children}</div>;
    return {default: EntityCard};
});
vi.mock("@coreModule/components/entityPage/list/card/entityCardRow.tsx", () => ({
    default: ({label, show = true}: {label: string; show?: boolean}) => (show ? <p>{label}</p> : null),
}));
vi.mock("@coreModule/components/viewEngine/widgets/gallery/galleryCarousel.tsx", () => ({
    AccessGatedGalleryCarousel: ({mainImage}: {mainImage: string}) => <img alt="cover" data-id={mainImage}/>,
}));
vi.mock("@coreModule/clients/panel/private/blogPosts/center/sheetView/blogPostSheetView.tsx", () => ({default: () => null}));
vi.mock("@coreModule/clients/panel/private/blogPosts/center/actions/publishBlogPost.tsx", () => ({default: () => null, PUBLISH_BLOG_POST_ACTION: "publish"}));
vi.mock("@coreModule/clients/panel/private/blogPosts/center/actions/unpublishBlogPost.tsx", () => ({default: () => null, UNPUBLISH_BLOG_POST_ACTION: "unpublish"}));
vi.mock("@coreModule/clients/panel/private/blogPosts/center/dialogs/setBlogPostPublishedDialog.tsx", () => ({default: () => null}));
const {pages} = vi.hoisted(() => ({pages: [] as Record<string, unknown>[]}));
vi.mock("@coreModule/components/entityPage/pages/createGenericCreatePage.tsx", () => ({
    createGenericCreatePage: (config: Record<string, unknown>) => {
        pages.push(config);
        return () => null;
    },
}));

import BlogPostCard from "../center/cardView/blogPostCard.tsx";
import "../createBlogPost.tsx";

const post = {_id: "p1", title: "The summer edit is here", slug: "the-summer-edit", category: {_id: "c1", name: "Store News"}, published: false, mainImage: "m1"};

// TD-F125: blog cards showed the slug but not the cover, an unpublished card read "Published date: ⓘ", and after
// Create the list lost its category filter.
describe("blog posts", () => {
    it("lead the card with the cover and leave the slug and an empty publish date off", () => {
        render(<BlogPostCard blogPost={post as never}/>);
        expect(screen.getByAltText("cover").getAttribute("data-id")).toBe("m1");
        expect(screen.queryByText("fields.slug")).toBeNull();
        expect(screen.queryByText("fields.publishedAt")).toBeNull();
        expect(screen.getByText("fields.category")).toBeTruthy();
    });

    it("return from Create to the list they came from", () => {
        expect(pages[0].successPath).toBeUndefined();
    });
});
