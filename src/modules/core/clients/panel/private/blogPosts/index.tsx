import {compose} from "redux";
import {useMemo} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {BookOpen} from "lucide-react";
import EntityListPage, {type QuickFilterDef} from "@coreModule/components/entityPage/pages/entityListPage.tsx";
import {COLUMN_TYPE} from "armonia/src/modules/core/database/filter/typeOperators";
import type {BlogPost} from "armonia/src/modules/core/api/auxiliary/private/blogPost/blogPost.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import BlogPostCard from "@coreModule/clients/panel/private/blogPosts/center/cardView/blogPostCard.tsx";
import BlogPostSheetView from "@coreModule/clients/panel/private/blogPosts/center/sheetView/blogPostSheetView.tsx";
import PublishBlogPost, {PUBLISH_BLOG_POST_ACTION} from "@coreModule/clients/panel/private/blogPosts/center/actions/publishBlogPost.tsx";
import UnpublishBlogPost, {UNPUBLISH_BLOG_POST_ACTION} from "@coreModule/clients/panel/private/blogPosts/center/actions/unpublishBlogPost.tsx";
import SetBlogPostPublishedDialog from "@coreModule/clients/panel/private/blogPosts/center/dialogs/setBlogPostPublishedDialog.tsx";
import { GRID_HIERARCHY } from "@coreModule/components/entityPage/list/entityCard.constants";

function buildEditPath(post: BlogPost) {
    const params = new URLSearchParams();
    params.set("blogPostId", post._id);
    if (post.title) params.set("blogPostName", post.title);
    return `/company/blogPosts/edit?${params.toString()}`;
}

function AllBlogPosts({resolveLanguageKey}: WithLanguageType) {
    const quickFilters = useMemo<QuickFilterDef[]>(() => [
        {
            field: "category",
            label: resolveLanguageKey("fields.category"),
            type: COLUMN_TYPE.OBJECT_ID,
            apiUrl: "/api/auxiliary/blogCategory/select",
        },
    ], [resolveLanguageKey]);

    return (
        <EntityListPage<BlogPost>
            apiUrl="/api/auxiliary/blogPost"
            collectionName="blogposts"
            accessModel="blogPosts"
            tableConfigKey="blogposts"
            rowActionMenu={{allowMenuForCustomChildren: true}}
            createPath="/company/blogPosts/create"
            createIcon={<BookOpen className="h-4 w-4" />}
            createLanguageKey="createBlogPost"
            buildEditPath={buildEditPath}
            cardViewClassName={GRID_HIERARCHY}
            resolveLanguageKey={resolveLanguageKey}
            sheetLanguagePath="src/modules/core/clients/panel/private/blogPosts/center/sheetView/blogPostSheetView.tsx"
            quickFilters={quickFilters}
            renderActionMenuChildren={(_entity, bindRowAction) => (
                <>
                    <PublishBlogPost blogPost={_entity} onAction={bindRowAction} />
                    <UnpublishBlogPost blogPost={_entity} onAction={bindRowAction} />
                </>
            )}
            renderFloatingModals={({action, entity, resetAction, listRef}) => {
                if (action === PUBLISH_BLOG_POST_ACTION || action === UNPUBLISH_BLOG_POST_ACTION) {
                    return (
                        <SetBlogPostPublishedDialog
                            open={true}
                            onOpenChange={(o: boolean) => { if (!o) resetAction(); }}
                            blogPost={entity}
                            targetPublished={action === PUBLISH_BLOG_POST_ACTION}
                            onSuccess={(post: BlogPost) => listRef.current?.updateRow?.(entity._id, post)}
                        />
                    );
                }
                return null;
            }}
            renderCard={(post, onDelete, onRestore) => (
                <BlogPostCard
                    blogPost={post}
                    onDelete={(row: BlogPost | undefined, response?: DeletedData) => onDelete(row, response)}
                    onRestore={() => onRestore(post)}
                />
            )}
            renderSheet={({entity, open, onOpenChange, onDelete, onRestore, listRef}) => (
                <BlogPostSheetView
                    open={open}
                    onOpenChange={(opened: boolean) => { if (!opened) onOpenChange(); }}
                    blogPost={entity}
                    onDelete={onDelete}
                    onRestore={onRestore}
                    onSheetRowPatched={(row: Record<string, unknown>) => {
                        listRef.current?.updateRow?.(entity._id, row as Partial<BlogPost>);
                    }}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/blogPosts/index.tsx"),
    withDebug(true, true, "blogPosts"),
)(AllBlogPosts);
