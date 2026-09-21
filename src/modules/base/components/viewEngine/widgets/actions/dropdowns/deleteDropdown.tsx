import withLanguage, {WithLanguageType} from "@baseModule/helpers/hocs/withLanguage.tsx";
import {compose} from "redux";
import withDebug from "@baseModule/helpers/hocs/withDebug.tsx";
import {Trash2} from "lucide-react";
import {useAccess} from "@baseModule/helpers/hooks/useAccess.ts";
import ActionDropdownItem from "@baseModule/components/viewEngine/widgets/actions/dropdowns/actionDropdownItem.tsx";

type DeleteDropdownProps = WithLanguageType & {
    onAction: (action: string) => void;
    accessModel: string;
};

function DeleteDropdown({resolveLanguageKey, onAction, accessModel}: DeleteDropdownProps) {
    const {delete: deleteModel} = useAccess(accessModel);
    return (
        <ActionDropdownItem
            label={resolveLanguageKey("title")}
            Icon={Trash2}
            shortcutKey="Backspace"
            shortcutLabel="⌫"
            tone="destructive"
            allowed={!!deleteModel}
            onSelect={() => onAction("delete")}
        />
    );
}

export default compose(
    withLanguage("src/modules/core/components/custom/actions/dropdowns/deleteDropdown.tsx"),
    withDebug(true, true)
)(DeleteDropdown);
