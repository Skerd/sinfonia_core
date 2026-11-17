import {IconTags} from "@tabler/icons-react";
import {createGenericCreatePage} from "@coreModule/components/entityPage/pages/createGenericCreatePage.tsx";
import {createBlogCategoryFormSchema} from "armonia/src/modules/core/api/auxiliary/private/blogCategory/createBlogCategory.form.validator.ts";
import {BLOG_CATEGORY_SLUG_MAX, type CreateBlogCategoryFormType} from "armonia/src/modules/core/api/auxiliary/private/blogCategory/blogCategory.schema-def.ts";
import {PrefillSlug} from "@coreModule/components/entityPage/pages/prefillSlug.tsx";

export default createGenericCreatePage<CreateBlogCategoryFormType>({
    languagePath: "src/modules/core/clients/panel/private/blogCategories/createBlogCategory.tsx",
    model: "blogcategories",
    apiUrl: "/api/auxiliary/blogCategory",
    schema: createBlogCategoryFormSchema,
    successPath: "/tenancy/systemSettings/blogCategories",
    // The slug follows the name until it is edited by hand (UX-05, TD-F116).
    renderChildren: (form) => <PrefillSlug form={form} from="name" to="slug" max={BLOG_CATEGORY_SLUG_MAX} />,
    submitIcon: <IconTags />,
});
