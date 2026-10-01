import {compose} from "redux";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {Tags} from "lucide-react";
import type {BlogCategory} from "armonia/src/modules/core/api/auxiliary/private/blogCategory/blogCategory.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import BlogCategoryCard from "@coreModule/clients/panel/private/blogCategories/center/cardView/blogCategoryCard.tsx";
import EntityListPage from "@coreModule/components/entityPage/pages/entityListPage.tsx";

function buildEditPath(category: BlogCategory) {
    const params = new URLSearchParams();
    params.set("blogCategoryId", category._id);
    if (category.name) params.set("blogCategoryName", category.name);
    return `/tenancy/systemSettings/blogCategories/edit?${params.toString()}`;
}

function AllBlogCategories({resolveLanguageKey}: WithLanguageType) {
    return (
        <EntityListPage<BlogCategory>
            apiUrl="/api/auxiliary/blogCategory"
            collectionName="blogcategories"
            accessModel="blogCategories"
            tableConfigKey="blogcategories"
            createPath="/tenancy/systemSettings/blogCategories/create"
            createIcon={<Tags className="h-4 w-4" />}
            createLanguageKey="createBlogCategory"
            buildEditPath={buildEditPath}
            resolveLanguageKey={resolveLanguageKey}
            sheetLanguagePath="src/modules/core/clients/panel/private/blogCategories/center/sheetView/blogCategorySheetView.tsx"
            renderCard={(category, onDelete, onRestore) => (
                <BlogCategoryCard
                    blogCategory={category}
                    onDelete={(row: BlogCategory | undefined, response?: DeletedData) => onDelete(row, response)}
                    onRestore={() => onRestore(category)}
                />
            )}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/blogCategories/index.tsx"),
    withDebug(true, true, "blogCategories"),
)(AllBlogCategories);
