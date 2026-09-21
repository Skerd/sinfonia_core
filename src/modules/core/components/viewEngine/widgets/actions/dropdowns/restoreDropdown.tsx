import withLanguage, {WithLanguageType} from "@coreModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withDebug from "@coreModule/helpers/hocs/withDebug.tsx";
import {RotateCcw} from "lucide-react";
import {useAccess} from "@coreModule/helpers/hooks/useAccess.ts";
import ActionDropdownItem from "@coreModule/components/viewEngine/widgets/actions/dropdowns/actionDropdownItem.tsx";

type RestoreDropdownProps = WithLanguageType & {
    onAction: (action: string) => void;
    accessModel: string;
};

function RestoreDropdown({resolveLanguageKey, onAction, accessModel}: RestoreDropdownProps) {
    const {restore} = useAccess(accessModel);
    return (
        <ActionDropdownItem
            label={resolveLanguageKey("title")}
            Icon={RotateCcw}
            shortcutKey="Enter"
            shortcutLabel="⏎"
            tone="success"
            allowed={!!restore}
            onSelect={() => onAction("restore")}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/actions/dropdowns/restoreDropdown.tsx"),
    withDebug(true, true)
)(RestoreDropdown);
