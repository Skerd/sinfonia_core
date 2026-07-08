import {compose} from "redux";
import {useEffect, useState} from "react";
import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {useAccess} from "@coreModule/helpers/hocs/withAccess.tsx";
import SheetViewRenderer from "@coreModule/components/viewEngine/SheetViewRenderer.tsx";
import {useViewConfig} from "@coreModule/helpers/hooks/useViewConfig.ts";
import type {DeletedData} from "armonia/src/modules/core/types/shared.types.ts";
import {Currency} from "armonia/src/modules/core/api/finance/private/currency/currency.dto.ts";

export type CurrencySheetViewOwnProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Full row or bootstrap from `#SmallInfoCard` while `/single` loads. */
    currency?: Currency;
    hideActions?: boolean;
    onDelete?: (response?: DeletedData) => void;
    onRestore?: () => void;
    fetchId?: string;
};

function currencyEditPath(c: Currency) {
    const params = new URLSearchParams();
    params.set("id", c._id);
    if (c.name) params.set("name", c.name);
    return `/tenancy/systemSettings/currencies/edit?${params.toString()}`;
}

function CurrencySheetView({
    open,
    onOpenChange,
    currency: currencyProp,
    resolveLanguageKey,
    hideActions = false,
    onDelete = () => {},
    onRestore = () => {},
    fetchId,
}: CurrencySheetViewOwnProps & WithLanguageType) {
    const access = useAccess("currencies");

    const viewConfig = useViewConfig("currencies", "sheet");
    const [sheetData, setSheetData] = useState<Record<string, any>>(currencyProp || { _id: fetchId });

    useEffect(() => {
        if (!currencyProp) return;
        setSheetData(currencyProp);
    }, [currencyProp]);

    const entityId = currencyProp?._id ?? fetchId;

    if (!viewConfig) {
        return null;
    }
    if (!entityId) return null;

    return (
        <SheetViewRenderer
            config={viewConfig}
            data={sheetData}
            url="/api/finance/currency/single"
            fetchId={fetchId}
            onDataFetched={(data) => setSheetData(data)}
            open={open}
            onOpenChange={onOpenChange}
            resolveLanguageKey={resolveLanguageKey}
            access={access}
            hideActions={hideActions}
            onDelete={onDelete}
            onRestore={onRestore}
            editPath={currencyEditPath(sheetData as Currency)}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/clients/panel/private/tenancy/systemSettings/currencies/center/sheetView/currencySheetView.tsx"),
    withDebug(true, true)
)(CurrencySheetView);
