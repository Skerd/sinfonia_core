import {compose} from "redux";
import {useImperativeHandle} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withAxios, {WithAxiosType} from "@coreModule/helpers/hocs/withAxios.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import ConfirmDialog from "@coreModule/components/custom/confirmDialog.tsx";
import type {BlogPost} from "armonia/src/modules/core/api/auxiliary/private/blogPost/blogPost.dto.ts";

type SetBlogPostPublishedDialogOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    blogPost: BlogPost;
    targetPublished: boolean;
    onSuccess?: (post: BlogPost) => void;
};

type SetBlogPostPublishedDialogProps = SetBlogPostPublishedDialogOwnProps &
    WithLanguageType &
    WithAxiosType<BlogPost> & {
        endpoint: "publish" | "unpublish";
    };

function SetBlogPostPublishedDialogInner({
    open,
    onOpenChange,
    blogPost,
    targetPublished,
    resolveLanguageKey,
    onSuccess,
    innerRef,
    onFilterChange,
    loading,
}: SetBlogPostPublishedDialogProps) {
    const langPrefix = targetPublished ? "publish" : "unpublish";

    useImperativeHandle(innerRef, () => ({
        success: (data: BlogPost) => {
            onSuccess?.(data);
            onOpenChange(false);
        },
        error: () => {
            onOpenChange(false);
        },
    }));

    return (
        <ConfirmDialog
            open={open}
            onOpenChange={(o: boolean) => { if (!loading) onOpenChange(o); }}
            title={resolveLanguageKey(`${langPrefix}.title`)}
            desc={resolveLanguageKey(`${langPrefix}.description`)}
            handleConfirm={() => onFilterChange({_id: blogPost._id})}
            isLoading={loading}
            destructive={!targetPublished}
        />
    );
}

const SetBlogPostPublishedDialogConnected = compose(
    withLanguage("src/modules/core/clients/panel/private/blogPosts/center/dialogs/setBlogPostPublishedDialog.tsx"),
    withAxios<BlogPost>(
        {
            method: "POST",
            url: "/api/auxiliary/blogPost",
            data: {},
            addToPath: [{whatToGet: ["endpoint"]}],
            onSuccessMessage: {
                if: "published",
                condition: false,
                message: "unpublished",
            },
        },
        true,
    ),
    withDebug(true, true, "blogPosts"),
)(SetBlogPostPublishedDialogInner);

export default function SetBlogPostPublishedDialog(props: SetBlogPostPublishedDialogOwnProps) {
    return (
        <SetBlogPostPublishedDialogConnected
            {...props}
            endpoint={props.targetPublished ? "publish" : "unpublish"}
        />
    );
}
