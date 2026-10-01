import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import type {BlogCategory} from "armonia/src/modules/core/api/auxiliary/private/blogCategory/blogCategory.dto.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";

export type BlogCategorySheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    blogCategory?: BlogCategory;
    hideActions?: boolean;
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
    fetchId?: string;
};

function buildEditPath(category: BlogCategory) {
    const params = new URLSearchParams();
    params.set("blogCategoryId", category._id);
    if (category.name) params.set("blogCategoryName", category.name);
    return `/tenancy/systemSettings/blogCategories/edit?${params.toString()}`;
}

function BlogCategorySheetView({
    open,
    onOpenChange,
    blogCategory: categoryProp,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    fetchId,
}: BlogCategorySheetViewOwnProps & WithLanguageType) {
    const [sheetData, setSheetData] = useState<Record<string, unknown>>(categoryProp || {_id: fetchId});
    const access = useAccess("blogCategories");
    const viewConfig = useViewConfig("blogcategories", "sheet");

    useEffect(() => {
        if (!categoryProp) return;
        setSheetData(categoryProp);
    }, [categoryProp]);

    const entityId = categoryProp?._id ?? fetchId;
    if (!viewConfig) return null;
    if (!entityId) return null;

    return (
        <SheetViewRenderer
            config={viewConfig}
            url="/api/auxiliary/blogCategory/single"
            fetchId={fetchId}
            onDataFetched={(data) => setSheetData(data)}
            data={sheetData}
            open={open}
            onOpenChange={onOpenChange}
            resolveLanguageKey={resolveLanguageKey}
            access={access}
            hideActions={hideActions}
            onDelete={onDelete}
            onRestore={onRestore}
            editPath={buildEditPath(sheetData as BlogCategory)}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/blogCategories/center/sheetView/blogCategorySheetView.tsx"),
    withDebug(true, true, "blogCategories"),
)(BlogCategorySheetView);
