import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {BlogPost} from "armonia/src/modules/core/api/auxiliary/private/blogPost/blogPost.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import PublishBlogPost, {PUBLISH_BLOG_POST_ACTION} from "@coreModule/clients/panel/private/blogPosts/center/actions/publishBlogPost.tsx";
import UnpublishBlogPost, {UNPUBLISH_BLOG_POST_ACTION} from "@coreModule/clients/panel/private/blogPosts/center/actions/unpublishBlogPost.tsx";
import SetBlogPostPublishedDialog from "@coreModule/clients/panel/private/blogPosts/center/dialogs/setBlogPostPublishedDialog.tsx";

export type BlogPostSheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    blogPost?: BlogPost;
    hideActions?: boolean;
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
    fetchId?: string;
    onSheetRowPatched?: (row: Record<string, unknown>) => void;
};

function buildEditPath(post: BlogPost) {
    const params = new URLSearchParams();
    params.set("blogPostId", post._id);
    if (post.title) params.set("blogPostName", post.title);
    return `/company/blogPosts/edit?${params.toString()}`;
}

function BlogPostSheetView({
    open,
    onOpenChange,
    blogPost: postProp,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    fetchId,
    onSheetRowPatched,
}: BlogPostSheetViewOwnProps & WithLanguageType) {
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(postProp || {_id: fetchId});
    const [action, setAction] = useState("");
    const access = useAccess("blogPosts");
    const viewConfig = useViewConfig("blogposts", "sheet");

    useEffect(() => {
        if (!open) setAction("");
    }, [open]);

    useEffect(() => {
        if (!postProp) return;
        setSheetData(postProp);
    }, [postProp]);

    const entityId = postProp?._id ?? fetchId;
    if (!viewConfig) return null;
    if (!entityId) return null;

    const asBlogPost = sheetData as BlogPost;

    return (
        <>
            <SheetViewRenderer
                config={viewConfig}
                url="/api/auxiliary/blogPost/single"
                fetchId={fetchId}
                onDataFetched={(data) => setSheetData(data)}
                data={sheetData}
                open={open}
                onOpenChange={onOpenChange}
                resolveLanguageKey={resolveLanguageKey}
                access={access}
                hideActions={hideActions}
                onDelete={onDelete}
                onRestore={onRestore}
                editPath={buildEditPath(asBlogPost)}
                onSheetRowPatched={onSheetRowPatched}
                actionMenuAllowCustomChildren
                actionMenuChildren={
                    <>
                        <PublishBlogPost blogPost={asBlogPost} onAction={(a: string) => setAction(a)} />
                        <UnpublishBlogPost blogPost={asBlogPost} onAction={(a: string) => setAction(a)} />
                    </>
                }
            />
            {(action === PUBLISH_BLOG_POST_ACTION || action === UNPUBLISH_BLOG_POST_ACTION) && (
                <SetBlogPostPublishedDialog
                    open={action === PUBLISH_BLOG_POST_ACTION || action === UNPUBLISH_BLOG_POST_ACTION}
                    onOpenChange={(o: boolean) => { if (!o) setAction(""); }}
                    blogPost={asBlogPost}
                    targetPublished={action === PUBLISH_BLOG_POST_ACTION}
                    onSuccess={(post: BlogPost) => {
                        setSheetData(post);
                        onSheetRowPatched?.(post);
                    }}
                />
            )}
        </>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/blogPosts/center/sheetView/blogPostSheetView.tsx"),
    withDebug(true, true, "blogPosts"),
)(BlogPostSheetView);
