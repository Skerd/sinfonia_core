import {compose} from "redux";
import type {ReactNode, RefObject} from "react";
import withLanguage, {type ResolveLanguageKey, WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {BlogPost} from "armonia/src/modules/core/api/auxiliary/private/blogPost/blogPost.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {IconCalendar} from "@tabler/icons-react";
import {Hash, Tag} from "lucide-react";
import BlogPostSheetView from "@coreModule/clients/panel/private/blogPosts/center/sheetView/blogPostSheetView.tsx";
import EntityCardRow from "@coreModule/components/entityPage/list/card/entityCardRow.tsx";
import EntityCard from "@coreModule/components/entityPage/list/card/entityCard.tsx";
import DisplayValue from "@coreModule/components/viewEngine/widgets/display/displayValue.tsx";
import {Badge} from "@coreModule/components/ui/badge.tsx";
import {cn} from "@coreModule/components/lib/utils.ts";
import {STATUS_BADGE_SUCCESS, STATUS_BADGE_WARNING} from "@coreModule/components/entityPage/list/entityCard.constants.ts";
import PublishBlogPost, {PUBLISH_BLOG_POST_ACTION} from "@coreModule/clients/panel/private/blogPosts/center/actions/publishBlogPost.tsx";
import UnpublishBlogPost, {UNPUBLISH_BLOG_POST_ACTION} from "@coreModule/clients/panel/private/blogPosts/center/actions/unpublishBlogPost.tsx";
import SetBlogPostPublishedDialog from "@coreModule/clients/panel/private/blogPosts/center/dialogs/setBlogPostPublishedDialog.tsx";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";

function BlogPostPublishedBadge({
    entity,
    resolveLanguageKey,
}: {
    entity: BlogPost;
    resolveLanguageKey: ResolveLanguageKey;
}): ReactNode {
    const published = !!entity.published;
    return (
        <DisplayValue path="published" value={entity.published}>
            {() => (
                <Badge
                    variant="outline"
                    className={cn("text-xs", published ? STATUS_BADGE_SUCCESS : STATUS_BADGE_WARNING)}
                >
                    {String(resolveLanguageKey(published ? "published" : "unpublished"))}
                </Badge>
            )}
        </DisplayValue>
    );
}

function buildEditPath(post: BlogPost) {
    const params = new URLSearchParams();
    params.set("blogPostId", post._id);
    if (post.title) params.set("blogPostName", post.title);
    return `/company/blogPosts/edit?${params.toString()}`;
}

type BlogPostCardProps = WithLanguageType & {
    blogPost: BlogPost;
    fetchId?: string;
    hideActions?: boolean;
    onDelete?: (deletedPost?: BlogPost, response?: DeletedData) => void;
    onRestore?: () => void;
    sheetOnly?: boolean;
    innerRef?: RefObject<WithAxiosLifecycleRef<BlogPost> | null>;
};

function BlogPostCard({
    blogPost,
    resolveLanguageKey,
    fetchId,
    hideActions = false,
    onDelete,
    onRestore,
    sheetOnly = false,
    innerRef,
}: BlogPostCardProps) {
    return (
        <EntityCard
            resource="blogPosts"
            entity={blogPost}
            fetchId={fetchId}
            singleUrl="/api/auxiliary/blogPost/single"
            onDelete={onDelete}
            onRestore={onRestore}
            hideActions={hideActions}
            sheetOnly={sheetOnly}
            editPath={buildEditPath}
            Sheet={BlogPostSheetView}
            sheetEntityProp="blogPost"
            deleteUrl="/api/auxiliary/blogPost"
            restoreUrl="/api/auxiliary/blogPost/restore"
            failedTitle={String(resolveLanguageKey("failedTitle"))}
            failedDescription={String(resolveLanguageKey("failedDescription"))}
            titlePath="title"
            innerRef={innerRef}
            sheetProps={({setEntity}) => ({
                fetchId,
                onSheetRowPatched: setEntity,
            })}
            extraDialogs={({action, setAction, entity, setEntity, retry}) => (
                <>
                    {(action === PUBLISH_BLOG_POST_ACTION || action === UNPUBLISH_BLOG_POST_ACTION) && (
                        <SetBlogPostPublishedDialog
                            open
                            onOpenChange={(open) => {
                                if (!open) setAction("");
                            }}
                            blogPost={entity}
                            targetPublished={action === PUBLISH_BLOG_POST_ACTION}
                            onSuccess={(post) => {
                                setEntity(post);
                                retry();
                            }}
                        />
                    )}
                </>
            )}
        >
            {({entity, setAction}) => (
                <>
                    <EntityCard.Header
                        titlePath="title"
                        title={entity.title}
                        badges={<BlogPostPublishedBadge entity={entity} resolveLanguageKey={resolveLanguageKey} />}
                    >
                        <PublishBlogPost blogPost={entity} onAction={setAction} />
                        <UnpublishBlogPost blogPost={entity} onAction={setAction} />
                    </EntityCard.Header>
                    <EntityCard.Body>
                        <EntityCardRow
                            icon={Tag}
                            label={resolveLanguageKey("fields.category")}
                            tooltip={resolveLanguageKey("fields.category")}
                            path="category.name"
                            value={entity.category.name}
                        />
                        <EntityCardRow
                            icon={Hash}
                            label={resolveLanguageKey("fields.slug")}
                            tooltip={resolveLanguageKey("fields.slug")}
                            path="slug"
                            value={entity.slug}
                        />
                        <EntityCardRow
                            icon={IconCalendar}
                            label={resolveLanguageKey("fields.publishedAt")}
                            tooltip={resolveLanguageKey("fields.publishedAt")}
                            path="publishedAt"
                            type="date"
                            value={entity.publishedAt}
                        />
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/blogPosts/center/cardView/blogPostCard.tsx"),
    withDebug(true, true, "blogPosts"),
)(BlogPostCard);
