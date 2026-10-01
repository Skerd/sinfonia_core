import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {Globe} from "lucide-react";
import type {BlogPost} from "armonia/src/modules/core/api/auxiliary/private/blogPost/blogPost.dto.ts";

export const PUBLISH_BLOG_POST_ACTION = "publishBlogPost";

type PublishBlogPostProps = WithLanguageType & {
    blogPost: Pick<BlogPost, "_id" | "published">;
    onAction: (action: string) => void;
};

function PublishBlogPost({blogPost, resolveLanguageKey, onAction}: PublishBlogPostProps) {
    const {write} = useAccess("blogPosts");

    if (!write?.published) return null;
    if (blogPost.published) return null;

    return (
        <DropdownMenuItem onClick={() => onAction(PUBLISH_BLOG_POST_ACTION)}>
            <Globe className="text-success" size={16} />
            {resolveLanguageKey("title")}
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/blogPosts/center/actions/publishBlogPost.tsx"),
    withDebug(true, true, "blogPosts"),
)(PublishBlogPost);
