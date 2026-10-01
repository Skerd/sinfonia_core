import {BookOpen} from "lucide-react";
import {createGenericCreatePage} from "@coreModule/components/entityPage/pages/createGenericCreatePage.tsx";
import {createBlogPostFormSchema} from "armonia/src/modules/core/api/auxiliary/private/blogPost/createBlogPost.form.validator.ts";
import type {CreateBlogPostFormType} from "armonia/src/modules/core/api/auxiliary/private/blogPost/blogPost.schema-def.ts";

export default createGenericCreatePage<CreateBlogPostFormType>({
    languagePath: "src/modules/core/clients/panel/private/blogPosts/createBlogPost.tsx",
    model: "blogposts",
    apiUrl: "/api/auxiliary/blogPost",
    schema: createBlogPostFormSchema,
    successPath: "/company/blogPosts",
    submitIcon: <BookOpen />,
});
