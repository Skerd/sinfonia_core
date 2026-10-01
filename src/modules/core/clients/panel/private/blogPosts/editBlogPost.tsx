import {Save} from "lucide-react";
import {createGenericEditPage} from "@coreModule/components/entityPage/pages/createGenericEditPage.tsx";
import {editBlogPostFormSchema} from "armonia/src/modules/core/api/auxiliary/private/blogPost/editBlogPost.form.validator.ts";
import type {BlogPost} from "armonia/src/modules/core/api/auxiliary/private/blogPost/blogPost.dto.ts";
import type {EditBlogPostFormType} from "armonia/src/modules/core/api/auxiliary/private/blogPost/blogPost.schema-def.ts";

export default createGenericEditPage<BlogPost, EditBlogPostFormType>({
    languagePath: "src/modules/core/clients/panel/private/blogPosts/editBlogPost.tsx",
    model: "blogposts",
    apiUrl: "/api/auxiliary/blogPost",
    schema: editBlogPostFormSchema,
    mapEntityData: (data) => ({
        ...data,
        category: data.category._id,
        mainImage: data.mainImage?._id ?? data.mainImage,
        imageGallery: data.imageGallery?.map((media) => media._id) ?? [],
    }),
    submitIcon: <Save />,
});
