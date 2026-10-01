import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import type {BlogCategory} from "armonia/src/modules/core/api/auxiliary/private/blogCategory/blogCategory.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {Hash} from "lucide-react";
import BlogCategorySheetView from "@coreModule/clients/panel/private/blogCategories/center/sheetView/blogCategorySheetView.tsx";
import EntityCardRow from "@coreModule/components/entityPage/list/card/entityCardRow.tsx";
import EntityCard from "@coreModule/components/entityPage/list/card/entityCard.tsx";
import type {WithAxiosLifecycleRef} from "@coreModule/helpers/hocs/withAxios.tsx";
import type {RefObject} from "react";

function buildEditPath(category: BlogCategory) {
    const params = new URLSearchParams();
    params.set("blogCategoryId", category._id);
    if (category.name) params.set("blogCategoryName", category.name);
    return `/tenancy/systemSettings/blogCategories/edit?${params.toString()}`;
}

type BlogCategoryCardProps = WithLanguageType & {
    blogCategory: BlogCategory;
    fetchId?: string;
    hideActions?: boolean;
    onDelete?: (deletedCategory?: BlogCategory, response?: DeletedData) => void;
    onRestore?: () => void;
    sheetOnly?: boolean;
    innerRef?: RefObject<WithAxiosLifecycleRef<BlogCategory> | null>;
};

function BlogCategoryCard({
    blogCategory,
    resolveLanguageKey,
    fetchId,
    hideActions = false,
    onDelete,
    onRestore,
    sheetOnly = false,
    innerRef,
}: BlogCategoryCardProps) {
    return (
        <EntityCard
            resource="blogCategories"
            entity={blogCategory}
            fetchId={fetchId}
            singleUrl="/api/auxiliary/blogCategory/single"
            onDelete={onDelete}
            onRestore={onRestore}
            hideActions={hideActions}
            sheetOnly={sheetOnly}
            editPath={buildEditPath}
            Sheet={BlogCategorySheetView}
            sheetEntityProp="blogCategory"
            deleteUrl="/api/auxiliary/blogCategory"
            restoreUrl="/api/auxiliary/blogCategory/restore"
            failedTitle={String(resolveLanguageKey("failedTitle"))}
            failedDescription={String(resolveLanguageKey("failedDescription"))}
            titlePath="name"
            innerRef={innerRef}
        >
            {({entity}) => (
                <>
                    <EntityCard.Header
                        titlePath="name"
                        title={entity.name}
                    />
                    <EntityCard.Body>
                        <EntityCardRow
                            icon={Hash}
                            label={resolveLanguageKey("slug")}
                            tooltip={resolveLanguageKey("slug")}
                            path="slug"
                            value={entity.slug}
                        />
                    </EntityCard.Body>
                </>
            )}
        </EntityCard>
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/blogCategories/center/cardView/blogCategoryCard.tsx"),
    withDebug(true, true, "blogCategories"),
)(BlogCategoryCard);
