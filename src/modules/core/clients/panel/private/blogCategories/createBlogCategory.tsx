import {Tags} from "lucide-react";
import {createGenericCreatePage} from "@coreModule/components/entityPage/pages/createGenericCreatePage.tsx";
import {createBlogCategoryFormSchema} from "armonia/src/modules/core/api/auxiliary/private/blogCategory/createBlogCategory.form.validator.ts";
import type {CreateBlogCategoryFormType} from "armonia/src/modules/core/api/auxiliary/private/blogCategory/blogCategory.schema-def.ts";

export default createGenericCreatePage<CreateBlogCategoryFormType>({
    languagePath: "src/modules/core/clients/panel/private/blogCategories/createBlogCategory.tsx",
    model: "blogcategories",
    apiUrl: "/api/auxiliary/blogCategory",
    schema: createBlogCategoryFormSchema,
    successPath: "/tenancy/systemSettings/blogCategories",
    submitIcon: <Tags />,
});
