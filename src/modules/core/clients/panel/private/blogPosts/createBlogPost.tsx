import {IconBook} from "@tabler/icons-react";
import {createGenericCreatePage} from "@coreModule/components/entityPage/pages/createGenericCreatePage.tsx";
import {createBlogPostFormSchema} from "armonia/src/modules/core/api/auxiliary/private/blogPost/createBlogPost.form.validator.ts";
import {BLOG_POST_SLUG_MAX, type CreateBlogPostFormType} from "armonia/src/modules/core/api/auxiliary/private/blogPost/blogPost.schema-def.ts";
import {PrefillSlug} from "@coreModule/components/entityPage/pages/prefillSlug.tsx";

export default createGenericCreatePage<CreateBlogPostFormType>({
    languagePath: "src/modules/core/clients/panel/private/blogPosts/createBlogPost.tsx",
    model: "blogposts",
    apiUrl: "/api/auxiliary/blogPost",
    schema: createBlogPostFormSchema,
    successPath: "/company/blogPosts",
    // The slug follows the title until it is edited by hand (UX-05, TD-F116).
    renderChildren: (form) => <PrefillSlug form={form} from="title" to="slug" max={BLOG_POST_SLUG_MAX} />,
    submitIcon: <IconBook />,
});
