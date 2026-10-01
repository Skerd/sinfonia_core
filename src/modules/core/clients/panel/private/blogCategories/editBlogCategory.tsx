import {createGenericEditPage} from "@coreModule/components/entityPage/pages/createGenericEditPage.tsx";
import {editBlogCategoryFormSchema} from "armonia/src/modules/core/api/auxiliary/private/blogCategory/editBlogCategory.form.validator.ts";
import type {BlogCategory} from "armonia/src/modules/core/api/auxiliary/private/blogCategory/blogCategory.dto.ts";
import type {EditBlogCategoryFormType} from "armonia/src/modules/core/api/auxiliary/private/blogCategory/blogCategory.schema-def.ts";

export default createGenericEditPage<BlogCategory, EditBlogCategoryFormType>({
    languagePath: "src/modules/core/clients/panel/private/blogCategories/editBlogCategory.tsx",
    model: "blogcategories",
    apiUrl: "/api/auxiliary/blogCategory",
    schema: editBlogCategoryFormSchema,
});
