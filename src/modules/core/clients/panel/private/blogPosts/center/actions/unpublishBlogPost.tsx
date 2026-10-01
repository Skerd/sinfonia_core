import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import {DropdownMenuItem} from "@coreModule/components/ui/dropdown-menu.tsx";
import {EyeOff} from "lucide-react";
import type {BlogPost} from "armonia/src/modules/core/api/auxiliary/private/blogPost/blogPost.dto.ts";

export const UNPUBLISH_BLOG_POST_ACTION = "unpublishBlogPost";

type UnpublishBlogPostProps = WithLanguageType & {
    blogPost: Pick<BlogPost, "_id" | "published">;
    onAction: (action: string) => void;
};

function UnpublishBlogPost({blogPost, resolveLanguageKey, onAction}: UnpublishBlogPostProps) {
    const {write} = useAccess("blogPosts");

    if (!write?.published) return null;
    if (!blogPost.published) return null;

    return (
        <DropdownMenuItem onClick={() => onAction(UNPUBLISH_BLOG_POST_ACTION)}>
            <EyeOff className="text-destructive" size={16} />
            {resolveLanguageKey("title")}
        </DropdownMenuItem>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/blogPosts/center/actions/unpublishBlogPost.tsx"),
    withDebug(true, true, "blogPosts"),
)(UnpublishBlogPost);
